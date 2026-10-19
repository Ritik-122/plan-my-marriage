import "server-only";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const schema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true },
    guestId: { type: Schema.Types.ObjectId, required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    providerMessageId: { type: String, select: false },
    emailRequestId: { type: String },
    emailRecipient: { type: String },
    emailStatus: { type: String, enum: ["SENDING", "SENT", "FAILED"] },
    createdBy: { type: Schema.Types.ObjectId, required: true },
  },
  { collection: "guestAccessTokens", timestamps: true, bufferCommands: false },
);
schema.index({ tokenHash: 1 }, { unique: true });
schema.index({ weddingId: 1, guestId: 1, createdAt: -1 });
export type AccessRecord = InferSchemaType<typeof schema>;
export const GuestAccessToken: Model<AccessRecord> =
  mongoose.models.GuestAccessToken ??
  mongoose.model("GuestAccessToken", schema);
