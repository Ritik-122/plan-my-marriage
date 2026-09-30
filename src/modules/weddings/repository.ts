import "server-only";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/db/mongoose";
import { HttpError } from "@/lib/http/errors";
import { Wedding, WeddingMember } from "./models";
import type { CreateWeddingInput, UpdateWeddingInput } from "./schema";

export async function memberships(userId: string) {
  await connectMongo();
  return WeddingMember.find({ userId })
    .sort({ joinedAt: -1, _id: -1 })
    .lean()
    .exec();
}
export async function findMembership(userId: string, weddingId: string) {
  await connectMongo();
  return WeddingMember.findOne({ userId, weddingId }).lean().exec();
}
export async function findWeddings(weddingIds: string[]) {
  await connectMongo();
  return Wedding.find({ _id: { $in: weddingIds } })
    .lean()
    .exec();
}
export async function findWedding(weddingId: string) {
  await connectMongo();
  return Wedding.findOne({ _id: weddingId }).lean().exec();
}
export async function createWithAdmin(
  userId: string,
  input: CreateWeddingInput,
) {
  await connectMongo();
  await Promise.all([Wedding.init(), WeddingMember.init()]);
  const [weddingIndexes, memberIndexes] = await Promise.all([
    Wedding.collection.indexes(),
    WeddingMember.collection.indexes(),
  ]);
  if (
    !weddingIndexes.some(
      (i) =>
        i.unique &&
        i.key.slug === 1 &&
        Object.keys(i.key).length === 1 &&
        !i.partialFilterExpression &&
        !i.sparse,
    ) ||
    !memberIndexes.some(
      (i) =>
        i.unique &&
        i.key.weddingId === 1 &&
        i.key.userId === 1 &&
        Object.keys(i.key).length === 2 &&
        !i.partialFilterExpression &&
        !i.sparse,
    )
  )
    throw new HttpError(
      503,
      "PROVIDER_UNAVAILABLE",
      "Wedding setup is temporarily unavailable.",
    );
  return mongoose.connection.transaction(async (session) => {
    const [wedding] = await Wedding.create(
      [
        {
          ...input,
          weddingDate: new Date(input.weddingDate),
          createdBy: userId,
        },
      ],
      { session },
    );
    await WeddingMember.create(
      [{ weddingId: wedding._id, userId, role: "ADMIN" }],
      { session },
    );
    return wedding;
  });
}
export async function updateWeddingRecord(
  weddingId: string,
  input: UpdateWeddingInput,
) {
  return Wedding.findOneAndUpdate(
    { _id: weddingId },
    { $set: input },
    { returnDocument: "after", runValidators: true },
  )
    .lean()
    .exec();
}
