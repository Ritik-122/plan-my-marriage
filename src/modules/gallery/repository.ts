import "server-only";
import mongoose, { type ClientSession } from "mongoose";
import { randomUUID } from "node:crypto";
import { Wedding, WeddingMember } from "@/modules/weddings/models";
import { WeddingEvent } from "@/modules/events/model";
import { HttpError } from "@/lib/http/errors";
import { verifyAndCopy, deleteObject } from "@/integrations/media/r2";
import { Photo, PhotoUploadIntent } from "./model";
import {
  photoCursorSchema,
  type PresignInput,
  type FinalizeInput,
  type PhotoFilters,
} from "./schema";
export const missingPhoto = () =>
  new HttpError(404, "NOT_FOUND", "Photo not found.");
async function transaction<T>(
  userId: string,
  weddingId: string,
  work: (session: ClientSession, role: "ADMIN" | "MANAGER") => Promise<T>,
) {
  return mongoose.connection.transaction(async (session) => {
    const wedding = await Wedding.findOneAndUpdate(
      { _id: weddingId },
      { $inc: { __v: 1 } },
      { session },
    );
    const member = await WeddingMember.findOne({
      weddingId,
      userId,
      role: { $in: ["ADMIN", "MANAGER"] },
    }).session(session);
    if (!wedding || !member) throw missingPhoto();
    return work(session, member.role);
  });
}
async function lockEvent(
  weddingId: string,
  eventId: string | null | undefined,
  session: ClientSession,
) {
  if (
    eventId &&
    !(await WeddingEvent.findOneAndUpdate(
      { weddingId, _id: eventId },
      { $inc: { __v: 1 } },
      { session },
    ))
  )
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Choose an existing event from this wedding.",
    );
}
export async function createIntent(
  userId: string,
  weddingId: string,
  input: PresignInput,
) {
  await Promise.all([Photo.init(), PhotoUploadIntent.init()]);
  for (const model of [Photo, PhotoUploadIntent]) {
    const indexes = await model.collection.indexes();
    if (
      !indexes.some(
        (i) =>
          i.unique &&
          i.key.objectKey === 1 &&
          Object.keys(i.key).length === 1 &&
          !i.sparse &&
          !i.partialFilterExpression,
      )
    )
      throw new HttpError(
        503,
        "PROVIDER_UNAVAILABLE",
        "Photo storage indexes must be configured.",
      );
  }
  const extension = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }[input.mimeType];
  const file = `${randomUUID()}.${extension}`;
  return transaction(userId, weddingId, async (session) => {
    await lockEvent(weddingId, input.eventId, session);
    const [intent] = await PhotoUploadIntent.create(
      [
        {
          weddingId,
          eventId: input.eventId ?? null,
          userId,
          objectKey: `weddings/${weddingId}/photos/${file}`,
          stagingKey: `staging/${weddingId}/${file}`,
          purpose: input.purpose,
          originalFileName: input.fileName,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          expiresAt: new Date(Date.now() + 86400000),
        },
      ],
      { session },
    );
    return intent;
  });
}
export async function finalizeRecord(
  userId: string,
  weddingId: string,
  input: FinalizeInput,
) {
  return transaction(userId, weddingId, async (session, role) => {
    const existing = await Photo.findOne({
      weddingId,
      objectKey: input.objectKey,
    }).session(session);
    if (existing) {
      if (
        existing.uploadedByUserId.toString() !== userId ||
        existing.purpose !== input.purpose ||
        (existing.eventId?.toString() ?? null) !== (input.eventId ?? null) ||
        existing.originalFileName !== input.originalFileName
      )
        throw missingPhoto();
      return existing;
    }
    const intent = await PhotoUploadIntent.findOne({
      weddingId,
      objectKey: input.objectKey,
      userId,
      state: "PENDING",
      expiresAt: { $gt: new Date() },
    }).session(session);
    if (!intent)
      throw new HttpError(
        404,
        "UPLOAD_NOT_FOUND",
        "Upload unavailable. Choose the photo again to start a new upload.",
      );
    if (
      intent.purpose !== input.purpose ||
      (intent.eventId?.toString() ?? null) !== (input.eventId ?? null) ||
      intent.originalFileName !== input.originalFileName
    )
      throw new HttpError(
        400,
        "UPLOAD_INVALID",
        "Upload details do not match the original request.",
      );
    await lockEvent(weddingId, input.eventId, session);
    await verifyAndCopy(
      intent.stagingKey,
      intent.objectKey,
      intent.mimeType,
      intent.sizeBytes,
    );
    const [photo] = await Photo.create(
      [
        {
          weddingId,
          eventId: intent.eventId,
          purpose: intent.purpose,
          objectKey: intent.objectKey,
          originalFileName: intent.originalFileName,
          mimeType: intent.mimeType,
          sizeBytes: intent.sizeBytes,
          uploadedByType: role,
          uploadedByUserId: userId,
        },
      ],
      { session },
    );
    intent.state = "FINALIZED";
    await intent.save({ session });
    return photo;
  });
}
export async function removeRecord(
  userId: string,
  weddingId: string,
  photoId: string,
) {
  await transaction(userId, weddingId, async (session) => {
    const photo = await Photo.findOne({ weddingId, _id: photoId }).session(
      session,
    );
    if (!photo) throw missingPhoto();
    await deleteObject(photo.objectKey);
    await PhotoUploadIntent.updateOne(
      { weddingId, objectKey: photo.objectKey },
      { $set: { state: "DELETED" } },
      { session },
    );
    await Photo.deleteOne({ weddingId, _id: photoId }, { session });
  });
}
export const getRecord = (weddingId: string, photoId: string) =>
  Photo.findOne({ weddingId, _id: photoId }).lean();
export async function listRecords(weddingId: string, input: PhotoFilters) {
  let cursor;
  if (input.cursor) {
    try {
      cursor = photoCursorSchema.parse(
        JSON.parse(Buffer.from(input.cursor, "base64url").toString()),
      );
    } catch {
      throw new HttpError(400, "VALIDATION_ERROR", "Invalid photo cursor.");
    }
  }
  return Photo.find({
    weddingId,
    ...(input.eventId
      ? { eventId: input.eventId === "general" ? null : input.eventId }
      : {}),
    ...(input.purpose ? { purpose: input.purpose } : {}),
    ...(input.uploadedByType ? { uploadedByType: input.uploadedByType } : {}),
    ...(cursor
      ? {
          $or: [
            { createdAt: { $lt: new Date(cursor.date) } },
            {
              createdAt: new Date(cursor.date),
              _id: { $lt: new mongoose.Types.ObjectId(cursor.id) },
            },
          ],
        }
      : {}),
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(input.limit + 1)
    .lean();
}
export async function summary(weddingId: string) {
  const rows = await Photo.aggregate([
    { $match: { weddingId: new mongoose.Types.ObjectId(weddingId) } },
    {
      $group: {
        _id: "$eventId",
        count: { $sum: 1 },
        sizeBytes: { $sum: "$sizeBytes" },
      },
    },
  ]);
  return {
    count: rows.reduce((sum, row) => sum + row.count, 0),
    sizeBytes: rows.reduce((sum, row) => sum + row.sizeBytes, 0),
    byEvent: rows.map((row) => ({
      eventId: row._id?.toString() ?? null,
      count: row.count,
    })),
  };
}
