import "server-only";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const schema = new Schema(
  {
    displayName: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    sessionVersion: { type: Number, required: true, default: 1, select: false },
  },
  { timestamps: true, collection: "users", bufferCommands: false },
);
schema.index({ email: 1 }, { unique: true });
export type UserRecord = InferSchemaType<typeof schema>;
export const User: Model<UserRecord> =
  mongoose.models.User ?? mongoose.model("User", schema);
