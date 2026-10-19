import "server-only";
import { getWedding } from "@/modules/weddings/service";
import { Wedding, WeddingMember } from "@/modules/weddings/models";
import { getAppConfig, getEmailConfig } from "@/lib/config/env.server";
import { connectMongo } from "@/lib/db/mongoose";
import { HttpError } from "@/lib/http/errors";
import { sendTeamEmail } from "@/lib/email/resend";
import {
  createToken,
  hashToken,
  tokenPattern,
} from "@/modules/invitations/token";
import { MemberInvitation } from "./model";
import * as repository from "./repository";
import type { InvitationContextDTO, TeamRole } from "./dto";
async function admin(userId: string, weddingId: string) {
  const wedding = await getWedding(userId, weddingId);
  if (wedding.role !== "ADMIN")
    throw new HttpError(
      403,
      "FORBIDDEN",
      "Only Admins can manage invitations.",
    );
  return wedding;
}
export async function listMembers(userId: string, weddingId: string) {
  await getWedding(userId, weddingId);
  return repository.members(weddingId);
}
export async function listInvitations(userId: string, weddingId: string) {
  await admin(userId, weddingId);
  return (
    await MemberInvitation.find({ weddingId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
  ).map(repository.invitationDTO);
}
export async function invite(
  userId: string,
  weddingId: string,
  input: { email: string; role: TeamRole },
  previousId?: string,
) {
  const wedding = await admin(userId, weddingId);
  getEmailConfig();
  const { token, tokenHash } = createToken();
  const row = await repository.createRecord(
    userId,
    weddingId,
    { ...input, tokenHash },
    previousId,
  );
  let providerMessageId: string;
  try {
    providerMessageId = await sendTeamEmail({
      email: row.email,
      role: row.role,
      couple: `${wedding.brideName} & ${wedding.groomName}`,
      url: new URL(
        `/member-invitations/accept#${token}`,
        getAppConfig().APP_BASE_URL,
      ).toString(),
      id: row._id.toString(),
    });
  } catch (error) {
    await MemberInvitation.updateOne(
      { _id: row._id, revokedAt: null },
      { $set: { deliveryState: "FAILED" } },
    );
    throw error;
  }
  const sent = await MemberInvitation.findOneAndUpdate(
    { _id: row._id, revokedAt: null },
    { $set: { sentAt: new Date(), providerMessageId, deliveryState: "SENT" } },
    { returnDocument: "after" },
  ).lean();
  if (!sent)
    throw new HttpError(
      409,
      "CONFLICT",
      "This invitation was revoked or replaced while sending. Refresh the team.",
    );
  return repository.invitationDTO(sent);
}
export async function revoke(userId: string, weddingId: string, id: string) {
  repository.checkId(id);
  await repository.adminTransaction(userId, weddingId, async (session) => {
    const row = await MemberInvitation.findOne({ _id: id, weddingId }).session(
      session,
    );
    if (!row) throw new HttpError(404, "NOT_FOUND", "Invitation not found.");
    if (row.acceptedAt)
      throw new HttpError(
        409,
        "CONFLICT",
        "Invitation already accepted. Manage the member instead.",
      );
    if (!row.revokedAt) {
      row.revokedAt = new Date();
      await row.save({ session });
    }
  });
}
export async function removeMember(
  userId: string,
  weddingId: string,
  id: string,
) {
  repository.checkId(id);
  await repository.adminTransaction(userId, weddingId, async (session) => {
    const row = await WeddingMember.findOne({ _id: id, weddingId }).session(
      session,
    );
    if (!row) throw new HttpError(404, "NOT_FOUND", "Member not found.");
    if (row.role === "ADMIN")
      throw new HttpError(403, "FORBIDDEN", "Admins cannot be removed.");
    await WeddingMember.deleteOne({
      _id: id,
      weddingId,
      role: "MANAGER",
    }).session(session);
  });
}
export async function invitationContext(
  token: string,
  user: InvitationContextDTO["user"],
): Promise<InvitationContextDTO> {
  if (!tokenPattern.test(token)) throw repository.invalidInvitation();
  await connectMongo();
  const row = await MemberInvitation.findOne({
    tokenHash: hashToken(token),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
    sentAt: { $ne: null },
  }).lean();
  if (!row) throw repository.invalidInvitation();
  const wedding = await Wedding.findById(row.weddingId).lean();
  if (!wedding) throw repository.invalidInvitation();
  if (
    row.acceptedAt &&
    user?.email === row.email &&
    !(await WeddingMember.exists({ weddingId: row.weddingId, userId: user.id }))
  )
    throw repository.invalidInvitation();
  return {
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    city: wedding.city,
    role: row.role,
    expiresAt: row.expiresAt.toISOString(),
    accepted: !!row.acceptedAt,
    user,
    emailMatches: user?.email === row.email,
  };
}
export async function accept(
  token: string,
  user: { id: string; email: string },
) {
  if (!tokenPattern.test(token)) throw repository.invalidInvitation();
  return repository.acceptRecord(hashToken(token), user);
}
