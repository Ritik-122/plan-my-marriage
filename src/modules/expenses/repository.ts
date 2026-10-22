import "server-only";
import mongoose, { type ClientSession } from "mongoose";
import { Wedding, WeddingMember } from "@/modules/weddings/models";
import { WeddingEvent } from "@/modules/events/model";
import { HttpError } from "@/lib/http/errors";
import { Expense } from "./model";
import {
  toPaise,
  expenseCursorSchema,
  type ExpenseInput,
  type ExpenseUpdate,
  type ExpenseFilters,
} from "./schema";
import type { ExpenseSummary } from "./dto";
export const missingExpense = () =>
  new HttpError(404, "NOT_FOUND", "Expense not found.");
async function transaction<T>(
  userId: string,
  weddingId: string,
  work: (session: ClientSession) => Promise<T>,
) {
  return mongoose.connection.transaction(async (session) => {
    const wedding = await Wedding.findOneAndUpdate(
      { _id: weddingId },
      { $inc: { __v: 1 } },
      { session },
    );
    if (
      !wedding ||
      !(await WeddingMember.exists({
        weddingId,
        userId,
        role: { $in: ["ADMIN", "MANAGER"] },
      }).session(session))
    )
      throw missingExpense();
    return work(session);
  });
}
async function checkEvent(
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
      "Choose an event from this wedding.",
      { eventId: "This event is no longer available." },
    );
}
function stored(input: ExpenseUpdate) {
  const { amount, date, ...rest } = input;
  return {
    ...rest,
    ...(amount !== undefined ? { amountPaise: toPaise(amount) } : {}),
    ...(date !== undefined ? { expenseDate: new Date(date) } : {}),
  };
}
export async function createRecord(
  userId: string,
  weddingId: string,
  input: ExpenseInput,
) {
  return transaction(userId, weddingId, async (session) => {
    await checkEvent(weddingId, input.eventId, session);
    const [row] = await Expense.create(
      [{ ...stored(input), weddingId, createdBy: userId }],
      { session },
    );
    return row;
  });
}
export async function updateRecord(
  userId: string,
  weddingId: string,
  expenseId: string,
  input: ExpenseUpdate,
) {
  return transaction(userId, weddingId, async (session) => {
    const row = await Expense.findOne({ weddingId, _id: expenseId }).session(
      session,
    );
    if (!row) throw missingExpense();
    await checkEvent(weddingId, input.eventId, session);
    row.set(stored(input));
    return row.save({ session });
  });
}
export async function deleteRecord(
  userId: string,
  weddingId: string,
  expenseId: string,
) {
  await transaction(userId, weddingId, async (session) => {
    if (
      !(await Expense.deleteOne({ weddingId, _id: expenseId }, { session }))
        .deletedCount
    )
      throw missingExpense();
  });
}
export const getRecord = (weddingId: string, expenseId: string) =>
  Expense.findOne({ weddingId, _id: expenseId }).lean();
export async function listRecords(weddingId: string, filters: ExpenseFilters) {
  let cursor: { date: string; id: string } | undefined;
  if (filters.cursor) {
    try {
      cursor = expenseCursorSchema.parse(
        JSON.parse(Buffer.from(filters.cursor, "base64url").toString()),
      );
    } catch {
      throw new HttpError(400, "VALIDATION_ERROR", "Invalid expense cursor.");
    }
  }
  const literal = filters.q?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const and = [];
  if (cursor)
    and.push({
      $or: [
        { expenseDate: { $lt: new Date(cursor.date) } },
        {
          expenseDate: new Date(cursor.date),
          _id: { $lt: new mongoose.Types.ObjectId(cursor.id) },
        },
      ],
    });
  if (literal)
    and.push({
      $or: ["name", "vendorName", "notes"].map((key) => ({
        [key]: { $regex: literal, $options: "i" },
      })),
    });
  return Expense.find({
    weddingId,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.eventId
      ? { eventId: filters.eventId === "general" ? null : filters.eventId }
      : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          expenseDate: {
            ...(filters.dateFrom ? { $gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { $lte: new Date(filters.dateTo) } : {}),
          },
        }
      : {}),
    ...(and.length ? { $and: and } : {}),
  })
    .sort({ expenseDate: -1, _id: -1 })
    .limit(filters.limit + 1)
    .lean();
}
export async function summary(weddingId: string): Promise<ExpenseSummary> {
  const [result] = await Expense.aggregate([
    { $match: { weddingId: new mongoose.Types.ObjectId(weddingId) } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              amount: { $sum: "$amountPaise" },
              count: { $sum: 1 },
            },
          },
        ],
        categories: [
          {
            $group: {
              _id: "$category",
              amount: { $sum: "$amountPaise" },
              count: { $sum: 1 },
            },
          },
          { $sort: { amount: -1, _id: 1 } },
        ],
        events: [
          {
            $group: {
              _id: { $ifNull: ["$eventId", null] },
              amount: { $sum: "$amountPaise" },
              count: { $sum: 1 },
            },
          },
          { $sort: { amount: -1, _id: 1 } },
        ],
      },
    },
  ]);
  const total = result.totals[0]?.amount ?? 0;
  if (!Number.isSafeInteger(total))
    throw new HttpError(
      503,
      "PROVIDER_UNAVAILABLE",
      "Expense totals exceed the supported range.",
    );
  return {
    totalAmountPaise: total,
    currency: "INR",
    count: result.totals[0]?.count ?? 0,
    byCategory: result.categories.map(
      (r: { _id: string; amount: number; count: number }) => ({
        category: r._id,
        amountPaise: r.amount,
        count: r.count,
      }),
    ),
    byEvent: result.events.map(
      (r: {
        _id: mongoose.Types.ObjectId | null;
        amount: number;
        count: number;
      }) => ({
        eventId: r._id?.toString() ?? null,
        amountPaise: r.amount,
        count: r.count,
      }),
    ),
  };
}
