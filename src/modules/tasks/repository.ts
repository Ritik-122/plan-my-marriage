import "server-only";
import mongoose, { type ClientSession } from "mongoose";
import { Wedding, WeddingMember } from "@/modules/weddings/models";
import { WeddingEvent } from "@/modules/events/model";
import { User } from "@/modules/auth/user.model";
import { HttpError } from "@/lib/http/errors";
import { Task } from "./model";
import type { TaskInput, TaskUpdate, TaskFilters } from "./schema";
import type { TaskOptions, TaskSummary } from "./dto";
export const missingTask = () =>
  new HttpError(404, "NOT_FOUND", "Task not found.");
export async function taskTransaction<T>(
  userId: string,
  weddingId: string,
  work: (session: ClientSession) => Promise<T>,
) {
  return mongoose.connection.transaction(async (session) => {
    // Shares the team-removal lock; authorization and assignment cannot race removal.
    const wedding = await Wedding.findOneAndUpdate(
      { _id: weddingId },
      { $inc: { __v: 1 } },
      { session },
    );
    if (
      !wedding ||
      !(await WeddingMember.exists({ weddingId, userId }).session(session))
    )
      throw missingTask();
    return work(session);
  });
}
async function checkReferences(
  weddingId: string,
  input: TaskUpdate,
  session: ClientSession,
) {
  if (
    input.assignedToUserId &&
    !(await WeddingMember.exists({
      weddingId,
      userId: input.assignedToUserId,
    }).session(session))
  )
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Choose a current wedding team member.",
    );
  if (
    input.eventId &&
    !(await WeddingEvent.findOneAndUpdate(
      { weddingId, _id: input.eventId },
      { $inc: { __v: 1 } },
      { session },
    ))
  )
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Choose an event from this wedding.",
    );
}
export async function createRecord(
  userId: string,
  weddingId: string,
  input: TaskInput,
) {
  return taskTransaction(userId, weddingId, async (session) => {
    await checkReferences(weddingId, input, session);
    const [task] = await Task.create(
      [
        {
          ...input,
          weddingId,
          createdBy: userId,
          completedAt: input.status === "COMPLETED" ? new Date() : null,
        },
      ],
      { session },
    );
    return task;
  });
}
export async function updateRecord(
  userId: string,
  weddingId: string,
  taskId: string,
  input: TaskUpdate,
) {
  return taskTransaction(userId, weddingId, async (session) => {
    const row = await Task.findOne({ _id: taskId, weddingId }).session(session);
    if (!row) throw missingTask();
    await checkReferences(weddingId, input, session);
    if (input.status && input.status !== row.status)
      row.completedAt = input.status === "COMPLETED" ? new Date() : null;
    row.set(input);
    return row.save({ session });
  });
}
export async function deleteRecord(
  userId: string,
  weddingId: string,
  taskId: string,
) {
  await taskTransaction(userId, weddingId, async (session) => {
    if (
      !(await Task.deleteOne({ _id: taskId, weddingId }, { session }))
        .deletedCount
    )
      throw missingTask();
  });
}
export const getRecord = (weddingId: string, taskId: string) =>
  Task.findOne({ weddingId, _id: taskId }).lean();
export async function listRecords(weddingId: string, filters: TaskFilters) {
  const {
    status,
    priority,
    eventId,
    assignedToUserId,
    dueBefore,
    dueAfter,
    cursor,
    q,
    overdue,
    limit,
  } = filters;
  return Task.find({
    weddingId,
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(eventId ? { eventId } : {}),
    ...(assignedToUserId ? { assignedToUserId } : {}),
    ...(cursor ? { _id: { $lt: cursor } } : {}),
    ...(q
      ? {
          title: {
            $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }
      : {}),
    ...(dueBefore || dueAfter
      ? {
          dueDate: {
            ...(dueBefore ? { $lte: new Date(dueBefore) } : {}),
            ...(dueAfter ? { $gte: new Date(dueAfter) } : {}),
          },
        }
      : {}),
    ...(overdue === "true"
      ? {
          $and: [
            { status: { $ne: "COMPLETED" } },
            { dueDate: { $ne: null, $lt: new Date() } },
          ],
        }
      : {}),
  })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
}
export async function summary(weddingId: string): Promise<TaskSummary> {
  const rows = await Task.aggregate([
    { $match: { weddingId: new mongoose.Types.ObjectId(weddingId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        todo: { $sum: { $cond: [{ $eq: ["$status", "TODO"] }, 1, 0] } },
        inProgress: {
          $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
        },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$status", "COMPLETED"] },
                  { $ne: ["$dueDate", null] },
                  { $lt: ["$dueDate", new Date()] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const row = rows[0];
  return {
    total: row?.total ?? 0,
    todo: row?.todo ?? 0,
    inProgress: row?.inProgress ?? 0,
    completed: row?.completed ?? 0,
    overdue: row?.overdue ?? 0,
  };
}
export async function options(weddingId: string): Promise<TaskOptions> {
  const members = await WeddingMember.find({ weddingId }).lean();
  const users = await User.find({ _id: { $in: members.map((m) => m.userId) } })
    .select("displayName")
    .lean();
  const events = await WeddingEvent.find({ weddingId })
    .sort({ startsAt: 1 })
    .lean();
  return {
    members: members.map((m) => ({
      userId: m.userId.toString(),
      name:
        users.find((u) => u._id.equals(m.userId))?.displayName ??
        "Unavailable account",
      role: m.role,
    })),
    events: events.map((e) => ({
      id: e._id.toString(),
      name: e.name,
      startsAt: e.startsAt.toISOString(),
      venue: e.venue?.name ?? "",
    })),
  };
}
