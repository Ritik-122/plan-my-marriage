import "server-only";
import mongoose from "mongoose";
import { HttpError } from "@/lib/http/errors";
import { WeddingEvent } from "./model";
import {
  validRange,
  type EventInput,
  type EventUpdate,
  type EventFilters,
} from "./schema";
export const missingEvent = () =>
  new HttpError(404, "NOT_FOUND", "Event not found.");
export async function listRecords(weddingId: string, filters: EventFilters) {
  return WeddingEvent.find({
    weddingId,
    ...(filters.from || filters.to
      ? {
          startsAt: {
            ...(filters.from ? { $gte: new Date(filters.from) } : {}),
            ...(filters.to ? { $lte: new Date(filters.to) } : {}),
          },
        }
      : {}),
  })
    .sort({ startsAt: 1, _id: 1 })
    .lean()
    .exec();
}
export async function getRecord(weddingId: string, eventId: string) {
  return WeddingEvent.findOne({ _id: eventId, weddingId }).lean().exec();
}
export async function createRecord(
  weddingId: string,
  userId: string,
  input: EventInput,
) {
  return WeddingEvent.create({ ...input, weddingId, createdBy: userId });
}
export async function updateRecord(
  weddingId: string,
  eventId: string,
  input: EventUpdate,
) {
  return mongoose.connection.transaction(async (session) => {
    const event = await WeddingEvent.findOne({
      _id: eventId,
      weddingId,
    }).session(session);
    if (!event) throw missingEvent();
    const startsAt = input.startsAt ?? event.startsAt.toISOString();
    const endsAt =
      input.endsAt === undefined ? event.endsAt?.toISOString() : input.endsAt;
    if (!validRange({ startsAt, endsAt }))
      throw new HttpError(
        400,
        "VALIDATION_ERROR",
        "End must be after the start.",
        { endsAt: "End must be after the start." },
      );
    const { venue, ...rest } = input;
    event.set(rest);
    if (venue)
      for (const [key, value] of Object.entries(venue))
        event.set(`venue.${key}`, value);
    return event.save({ session });
  });
}
export async function deleteRecord(weddingId: string, eventId: string) {
  await mongoose.connection.transaction(async (session) => {
    const event = await WeddingEvent.findOne({
      _id: eventId,
      weddingId,
    }).session(session);
    if (!event) throw missingEvent();
    const db = mongoose.connection.db!;
    const filter = { weddingId: event.weddingId, eventId: event._id };
    // Photos must be explicitly deleted through the gallery before removing an event.
    if (
      await db
        .collection("photos")
        .findOne(filter, { session, projection: { _id: 1 } })
    )
      throw new HttpError(
        409,
        "INVALID_STATE",
        "This event has photos. Delete them from the gallery before deleting the event.",
      );
    await db.collection("eventGuests").deleteMany(filter, { session });
    await db
      .collection("photoUploadTokens")
      .updateMany(filter, { $set: { revokedAt: new Date() } }, { session });
    for (const collection of ["tasks", "expenses"])
      await db
        .collection(collection)
        .updateMany(filter, { $unset: { eventId: "" } }, { session });
    await WeddingEvent.deleteOne(
      { _id: event._id, weddingId: event.weddingId },
      { session },
    );
  });
}
