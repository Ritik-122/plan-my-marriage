import "server-only";
import mongoose, { type ClientSession } from "mongoose";
import { connectMongo } from "@/lib/db/mongoose";
import { Wedding, WeddingMember } from "@/modules/weddings/models";
import { User } from "@/modules/auth/user.model";
import { HttpError } from "@/lib/http/errors";
import { MemberInvitation, type TeamInvitationRecord } from "./model";
import type { TeamInvitationDTO, TeamMemberDTO, TeamRole } from "./dto";
export const invalidInvitation = () =>
  new HttpError(
    410,
    "INVALID_STATE",
    "This invitation is unavailable, expired, or revoked. Ask an Admin for a new invitation.",
  );
export function checkId(id: string) {
  if (!/^[a-f\d]{24}$/i.test(id))
    throw new HttpError(404, "NOT_FOUND", "Team record not found.");
}
export function invitationDTO(
  row: TeamInvitationRecord & { _id: mongoose.Types.ObjectId },
): TeamInvitationDTO {
  return {
    id: row._id.toString(),
    email: row.email,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    sentAt: row.sentAt?.toISOString() ?? null,
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    deliveryState: row.deliveryState,
  };
}
async function lockWedding(weddingId: string, session: ClientSession) {
  const wedding = await Wedding.findOneAndUpdate(
    { _id: weddingId },
    { $inc: { __v: 1 } },
    { session, returnDocument: "after" },
  );
  if (!wedding) throw new HttpError(404, "NOT_FOUND", "Wedding not found.");
  return wedding;
}
export async function adminTransaction<T>(
  userId: string,
  weddingId: string,
  work: (session: ClientSession) => Promise<T>,
) {
  checkId(weddingId);
  await connectMongo();
  return mongoose.connection.transaction(async (session) => {
    await lockWedding(weddingId, session);
    const member = await WeddingMember.findOne({ weddingId, userId }).session(
      session,
    );
    if (!member) throw new HttpError(404, "NOT_FOUND", "Wedding not found.");
    if (member.role !== "ADMIN")
      throw new HttpError(403, "FORBIDDEN", "Only Admins can manage the team.");
    return work(session);
  });
}
export async function members(weddingId: string): Promise<TeamMemberDTO[]> {
  const rows = await WeddingMember.find({ weddingId })
    .sort({ joinedAt: 1 })
    .lean();
  const users = await User.find({ _id: { $in: rows.map((row) => row.userId) } })
    .select("displayName email")
    .lean();
  return rows.map((row) => {
    const user = users.find((user) => user._id.equals(row.userId));
    return {
      id: row._id.toString(),
      displayName: user?.displayName ?? "Unavailable account",
      email: user?.email ?? "",
      role: row.role,
      joinedAt: row.joinedAt.toISOString(),
    };
  });
}
export async function createRecord(
  userId: string,
  weddingId: string,
  input: { email: string; role: TeamRole; tokenHash: string },
  previousId?: string,
) {
  if (previousId) checkId(previousId);
  // Required uniqueness must exist even with production autoIndex disabled.
  const indexes = await MemberInvitation.collection.indexes();
  if (
    !indexes.some(
      (index) =>
        index.unique &&
        index.key.tokenHash === 1 &&
        Object.keys(index.key).length === 1,
    )
  )
    throw new HttpError(
      503,
      "PROVIDER_UNAVAILABLE",
      "Team invitation indexes need setup.",
    );
  return adminTransaction(userId, weddingId, async (session) => {
    let email = input.email;
    let role = input.role;
    if (previousId) {
      const previous = await MemberInvitation.findOne({
        _id: previousId,
        weddingId,
        acceptedAt: null,
        revokedAt: null,
      }).session(session);
      if (!previous)
        throw new HttpError(
          409,
          "CONFLICT",
          "Invitation was already accepted, revoked, or replaced. Refresh the team.",
        );
      email = previous.email;
      role = previous.role;
      previous.revokedAt = new Date();
      await previous.save({ session });
    }
    const user = await User.findOne({ email }).session(session);
    if (
      user &&
      (await WeddingMember.exists({ weddingId, userId: user._id }).session(
        session,
      ))
    )
      throw new HttpError(
        409,
        "CONFLICT",
        "This person is already a wedding member.",
      );
    if (
      await MemberInvitation.exists({
        weddingId,
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      }).session(session)
    )
      throw new HttpError(
        409,
        "CONFLICT",
        "An invitation already exists for this email. Resend or revoke it first.",
      );
    const [record] = await MemberInvitation.create(
      [
        {
          weddingId,
          email,
          role,
          tokenHash: input.tokenHash,
          createdBy: userId,
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
      ],
      { session },
    );
    return record;
  });
}
export async function acceptRecord(
  tokenHash: string,
  user: { id: string; email: string },
) {
  await connectMongo();
  const initial = await MemberInvitation.findOne({ tokenHash }).lean();
  if (!initial) throw invalidInvitation();
  return mongoose.connection.transaction(async (session) => {
    await lockWedding(initial.weddingId.toString(), session);
    const row = await MemberInvitation.findOne({
      _id: initial._id,
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
      sentAt: { $ne: null },
    }).session(session);
    if (!row) throw invalidInvitation();
    if (row.email !== user.email)
      throw new HttpError(
        403,
        "FORBIDDEN",
        "Sign in using the email address that received this invitation.",
      );
    const member = await WeddingMember.findOne({
      weddingId: row.weddingId,
      userId: user.id,
    }).session(session);
    if (row.acceptedAt) {
      if (!member) throw invalidInvitation();
      return { weddingId: row.weddingId.toString(), role: member.role };
    }
    if (member)
      throw new HttpError(
        409,
        "CONFLICT",
        "You already belong to this wedding. Your role has not changed.",
      );
    await WeddingMember.create(
      [{ weddingId: row.weddingId, userId: user.id, role: row.role }],
      { session },
    );
    const accepted = await MemberInvitation.updateOne(
      { _id: row._id, expiresAt: { $gt: new Date() } },
      { $set: { acceptedAt: new Date() } },
      { session },
    );
    if (!accepted.modifiedCount) throw invalidInvitation();
    return { weddingId: row.weddingId.toString(), role: row.role };
  });
}
