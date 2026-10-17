import "server-only";
import mongoose, { type ClientSession } from "mongoose";
import { z } from "zod";
import { HttpError } from "@/lib/http/errors";
import { WeddingEvent } from "@/modules/events/model";
import { eventDTO } from "@/modules/events/dto";
import { Guest, EventGuest } from "./models";
import { guestDTO } from "./dto";
import {
  objectId,
  type GuestInput,
  type GuestUpdate,
  type GuestFilters,
} from "./schema";
export const missingGuest = () =>
  new HttpError(404, "NOT_FOUND", "Guest not found.");
const cursorSchema = z
  .object({ name: z.string().max(150), id: objectId })
  .strict();
export function decodeCursor(cursor: string) {
  try {
    return cursorSchema.parse(
      JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
    );
  } catch {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid guest cursor.");
  }
}
export function escapeSearch(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
async function validateGroup(
  weddingId: string,
  groupId: string | null | undefined,
) {
  if (
    groupId &&
    !(await mongoose.connection.db!.collection("guestGroups").findOne(
      {
        _id: new mongoose.Types.ObjectId(groupId),
        weddingId: new mongoose.Types.ObjectId(weddingId),
      },
      { projection: { _id: 1 } },
    ))
  )
    throw new HttpError(404, "NOT_FOUND", "Guest group not found.");
}
export async function listRecords(weddingId: string, filters: GuestFilters) {
  const clauses: Record<string, unknown>[] = [{ weddingId }];
  if (filters.q) {
    const q = { $regex: escapeSearch(filters.q), $options: "i" };
    clauses.push({ $or: [{ name: q }, { email: q }, { phone: q }] });
  }
  if (filters.groupId) clauses.push({ guestGroupId: filters.groupId });
  if (filters.eventId) {
    const ids = await EventGuest.find({
      weddingId,
      eventId: filters.eventId,
      ...(filters.rsvpStatus ? { rsvpStatus: filters.rsvpStatus } : {}),
    }).distinct("guestId");
    clauses.push({ _id: { $in: ids } });
  }
  const matched = await Guest.countDocuments({ $and: clauses });
  if (filters.cursor) {
    const c = decodeCursor(filters.cursor);
    clauses.push({
      $or: [{ name: { $gt: c.name } }, { name: c.name, _id: { $gt: c.id } }],
    });
  }
  const records = await Guest.find({ $and: clauses })
    .sort({ name: 1, _id: 1 })
    .limit(filters.limit + 1)
    .lean();
  const more = records.length > filters.limit;
  const page = records.slice(0, filters.limit);
  const last = page.at(-1);
  const assignments = await EventGuest.find({
    weddingId,
    guestId: { $in: page.map((g) => g._id) },
  }).lean();
  const events = await WeddingEvent.find({
    weddingId,
    _id: { $in: assignments.map((a) => a.eventId) },
  })
    .sort({ startsAt: 1, _id: 1 })
    .lean();
  return {
    data: page.map((g) => ({
      ...guestDTO(g),
      ...(filters.eventId
        ? {
            rsvpStatus:
              assignments.find(
                (a) =>
                  a.guestId.equals(g._id) &&
                  a.eventId.toString() === filters.eventId?.toLowerCase(),
              )?.rsvpStatus ?? "PENDING",
            respondedAt:
              assignments
                .find(
                  (a) =>
                    a.guestId.equals(g._id) &&
                    a.eventId.toString() === filters.eventId?.toLowerCase(),
                )
                ?.respondedAt?.toISOString() ?? null,
          }
        : {}),
      events: events
        .filter((e) =>
          assignments.some(
            (a) => a.guestId.equals(g._id) && a.eventId.equals(e._id),
          ),
        )
        .map((e) => ({ id: e._id.toString(), name: e.name })),
    })),
    nextCursor:
      more && last
        ? Buffer.from(
            JSON.stringify({ name: last.name, id: last._id.toString() }),
          ).toString("base64url")
        : null,
    matched,
    total: await Guest.countDocuments({ weddingId }),
  };
}
export async function eventResponseCounts(weddingId: string, eventId: string) {
  const rows = await EventGuest.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        weddingId: new mongoose.Types.ObjectId(weddingId),
        eventId: new mongoose.Types.ObjectId(eventId),
      },
    },
    { $group: { _id: "$rsvpStatus", count: { $sum: 1 } } },
  ]);
  const count = (status: string) =>
    rows.find((r) => r._id === status)?.count ?? 0;
  const attending = count("ATTENDING"),
    notAttending = count("NOT_ATTENDING"),
    pending = count("PENDING");
  return {
    attending,
    notAttending,
    pending,
    total: attending + notAttending + pending,
  };
}
export async function getRecord(weddingId: string, guestId: string) {
  return Guest.findOne({ weddingId, _id: guestId }).lean();
}
export async function createRecord(
  weddingId: string,
  userId: string,
  input: GuestInput,
) {
  await validateGroup(weddingId, input.guestGroupId);
  return Guest.create({ ...input, weddingId, createdBy: userId });
}
export async function updateRecord(
  weddingId: string,
  guestId: string,
  input: GuestUpdate,
) {
  await validateGroup(weddingId, input.guestGroupId);
  return Guest.findOneAndUpdate(
    { weddingId, _id: guestId },
    { $set: input },
    { returnDocument: "after", runValidators: true },
  ).lean();
}
export async function assignedEvents(weddingId: string, guestId: string) {
  const assignments = await EventGuest.find({ weddingId, guestId }).lean();
  const events = await WeddingEvent.find({
    weddingId,
    _id: { $in: assignments.map((a) => a.eventId) },
  })
    .sort({ startsAt: 1, _id: 1 })
    .lean();
  return events.map((e) => ({
    ...eventDTO(e),
    rsvpStatus: assignments.find((a) => a.eventId.equals(e._id))!.rsvpStatus,
  }));
}
export async function deleteRecord(weddingId: string, guestId: string) {
  await mongoose.connection.transaction(async (session) => {
    const guest = await Guest.findOneAndDelete(
      { weddingId, _id: guestId },
      { session },
    );
    if (!guest) throw missingGuest();
    const filter = { weddingId: guest.weddingId, guestId: guest._id };
    await EventGuest.deleteMany(filter, { session });
    await mongoose.connection
      .db!.collection("guestAccessTokens")
      .updateMany(filter, { $set: { revokedAt: new Date() } }, { session });
  });
}
async function lockParents(
  weddingId: string,
  eventId: string,
  guestIds: string[],
  session: ClientSession,
) {
  // Writes serialize assignments with event/guest deletion and concurrent assignments.
  const event = await WeddingEvent.updateOne(
    { _id: eventId, weddingId },
    { $inc: { __v: 1 } },
    { session },
  );
  if (event.matchedCount !== 1)
    throw new HttpError(404, "NOT_FOUND", "Event not found.");
  for (const id of [...guestIds].sort()) {
    const guest = await Guest.updateOne(
      { _id: id, weddingId },
      { $inc: { __v: 1 } },
      { session },
    );
    if (guest.matchedCount !== 1) throw missingGuest();
  }
}
export async function changeAssignments(
  weddingId: string,
  eventId: string,
  guestIds: string[],
  remove: boolean,
) {
  await EventGuest.init();
  const indexes = await EventGuest.collection.indexes();
  if (
    !indexes.some(
      (i) =>
        i.unique &&
        i.key.eventId === 1 &&
        i.key.guestId === 1 &&
        Object.keys(i.key).length === 2 &&
        !i.sparse &&
        !i.partialFilterExpression,
    )
  )
    throw new HttpError(
      503,
      "PROVIDER_UNAVAILABLE",
      "Guest assignment setup is temporarily unavailable.",
    );
  return mongoose.connection.transaction(async (session) => {
    await lockParents(weddingId, eventId, guestIds, session);
    if (remove) {
      const result = await EventGuest.deleteMany(
        { weddingId, eventId, guestId: { $in: guestIds } },
        { session },
      );
      return { removed: result.deletedCount };
    }
    let created = 0;
    for (const guestId of guestIds) {
      const result = await EventGuest.updateOne(
        { weddingId, eventId, guestId },
        { $setOnInsert: { rsvpStatus: "PENDING" } },
        { upsert: true, session },
      );
      created += result.upsertedCount;
    }
    return { created, alreadyAssigned: guestIds.length - created };
  });
}
