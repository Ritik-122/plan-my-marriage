import "server-only";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { imageTypes, purposes } from "./schema";
const photoSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true },
    eventId: { type: Schema.Types.ObjectId, default: null },
    purpose: { type: String, enum: purposes, required: true },
    objectKey: { type: String, required: true },
    originalFileName: { type: String, required: true, maxlength: 255 },
    mimeType: { type: String, enum: imageTypes, required: true },
    sizeBytes: { type: Number, required: true },
    uploadedByType: {
      type: String,
      enum: ["ADMIN", "MANAGER", "GUEST"],
      required: true,
    },
    uploadedByUserId: { type: Schema.Types.ObjectId, required: true },
  },
  { collection: "photos", timestamps: true, bufferCommands: false },
);
photoSchema.index({ objectKey: 1 }, { unique: true });
photoSchema.index({ weddingId: 1, createdAt: -1, _id: -1 });
photoSchema.index({ weddingId: 1, eventId: 1, createdAt: -1 });
photoSchema.index({ weddingId: 1, purpose: 1, createdAt: -1 });
const intentSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true },
    eventId: { type: Schema.Types.ObjectId, default: null },
    userId: { type: Schema.Types.ObjectId, required: true },
    objectKey: { type: String, required: true },
    stagingKey: { type: String, required: true },
    purpose: { type: String, enum: purposes, required: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, enum: imageTypes, required: true },
    sizeBytes: { type: Number, required: true },
    state: {
      type: String,
      enum: ["PENDING", "FINALIZED", "DELETED"],
      default: "PENDING",
      required: true,
    },
    expiresAt: { type: Date, required: true },
  },
  { collection: "photoUploadIntents", timestamps: true, bufferCommands: false },
);
intentSchema.index({ objectKey: 1 }, { unique: true });
intentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export type PhotoRecord = InferSchemaType<typeof photoSchema>;
export const Photo: Model<PhotoRecord> =
  mongoose.models.Photo ?? mongoose.model("Photo", photoSchema);
type IntentRecord = InferSchemaType<typeof intentSchema>;
export const PhotoUploadIntent: Model<IntentRecord> =
  mongoose.models.PhotoUploadIntent ??
  mongoose.model("PhotoUploadIntent", intentSchema);
