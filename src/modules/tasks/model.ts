import "server-only";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { statuses, priorities } from "./schema";
const schema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 2000 },
    eventId: { type: Schema.Types.ObjectId, default: null },
    assignedToUserId: { type: Schema.Types.ObjectId, default: null },
    priority: {
      type: String,
      enum: priorities,
      required: true,
      default: "MEDIUM",
    },
    status: { type: String, enum: statuses, required: true, default: "TODO" },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, required: true },
  },
  { collection: "tasks", timestamps: true, bufferCommands: false },
);
schema.index({ weddingId: 1, status: 1, dueDate: 1 });
schema.index({ weddingId: 1, assignedToUserId: 1, status: 1 });
schema.index({ weddingId: 1, eventId: 1, status: 1 });
schema.index({ weddingId: 1, _id: -1 });
export type TaskRecord = InferSchemaType<typeof schema>;
export const Task: Model<TaskRecord> =
  mongoose.models.Task ?? mongoose.model("Task", schema);
