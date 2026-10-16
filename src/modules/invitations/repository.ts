import "server-only";
import mongoose from "mongoose";
import { Guest, EventGuest } from "@/modules/guests/models";
import { Wedding } from "@/modules/weddings/models";
import { WeddingEvent } from "@/modules/events/model";
import { HttpError } from "@/lib/http/errors";
import { GuestAccessToken } from "./model";
import { invitationDTO, linkDTO } from "./dto";
export const invalidLink = () =>
  new HttpError(
    401,
    "GUEST_LINK_INVALID",
    "This invitation link is no longer available.",
  );
export async function createRecord(
  weddingId: string,
  guestId: string,
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) {
  await GuestAccessToken.init();
  const indexes = await GuestAccessToken.collection.indexes();
  if (
    !indexes.some(
      (i) =>
        i.unique &&
        i.key.tokenHash === 1 &&
        Object.keys(i.key).length === 1 &&
        !i.sparse &&
        !i.partialFilterExpression,
    )
  )
    throw new HttpError(
      503,
      "PROVIDER_UNAVAILABLE",
      "Invitation setup is temporarily unavailable.",
    );
  return mongoose.connection.transaction(async (session) => {
    const guest = await Guest.updateOne(
      { _id: guestId, weddingId },
      { $inc: { __v: 1 } },
      { session },
    );
    if (!guest.matchedCount)
      throw new HttpError(404, "NOT_FOUND", "Guest not found.");
    const [record] = await GuestAccessToken.create(
      [{ weddingId, guestId, createdBy: userId, tokenHash, expiresAt }],
      { session },
    );
    return record._id.toString();
  });
}
export async function listRecords(weddingId: string, guestId: string) {
  return (
    await GuestAccessToken.find({ weddingId, guestId })
      .sort({ createdAt: -1, _id: -1 })
      .lean()
  ).map(linkDTO);
}
export async function revokeRecord(
  weddingId: string,
  guestId: string,
  id: string,
) {
  const record = await GuestAccessToken.findOneAndUpdate(
    { _id: id, weddingId, guestId },
    { $set: { revokedAt: new Date() } },
  );
  if (!record)
    throw new HttpError(404, "NOT_FOUND", "Invitation link not found.");
}
export async function contextForGuest(weddingId: string, guestId: string) {
  const guest = await Guest.findOne({ _id: guestId, weddingId }).lean();
  const wedding = await Wedding.findById(weddingId).lean();
  if (!guest || !wedding) throw invalidLink();
  const assigned = await EventGuest.find({ weddingId, guestId }).lean();
  const events = await WeddingEvent.find({
    weddingId,
    _id: { $in: assigned.map((a) => a.eventId) },
  })
    .sort({ startsAt: 1, _id: 1 })
    .lean();
  return invitationDTO(
    guest,
    wedding,
    events.map((e) => ({
      ...e,
      rsvpStatus: assigned.find((a) => a.eventId.equals(e._id))!.rsvpStatus,
    })),
  );
}
export async function readByHash(tokenHash: string) {
  const valid = () => ({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
  const record = await GuestAccessToken.findOne(valid()).lean();
  if (!record) throw invalidLink();
  const context = await contextForGuest(
    record.weddingId.toString(),
    record.guestId.toString(),
  );
  // Check validity again after reading context, and serialize against revocation.
  const used = await GuestAccessToken.updateOne(valid(), {
    $set: { lastUsedAt: new Date() },
  });
  if (!used.matchedCount) throw invalidLink();
  return context;
}
