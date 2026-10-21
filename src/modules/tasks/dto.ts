import type { Types } from "mongoose";
import type { TaskRecord } from "./model";
export function taskDTO(row: TaskRecord & { _id: Types.ObjectId }) {
  return {
    id: row._id.toString(),
    weddingId: row.weddingId.toString(),
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    eventId: row.eventId?.toString() ?? null,
    assignedToUserId: row.assignedToUserId?.toString() ?? null,
    dueDate: row.dueDate?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdBy: row.createdBy.toString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
export type TaskDTO = ReturnType<typeof taskDTO>;
export type TaskOptions = {
  members: { userId: string; name: string; role: string }[];
  events: { id: string; name: string; startsAt: string; venue: string }[];
};
export type TaskSummary = {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
};
