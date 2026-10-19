import "server-only";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const schema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "MANAGER"], required: true },
    tokenHash: { type: String, required: true, select: false },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    expiresAt: { type: Date, required: true },
    sentAt: { type: Date, default: null },
    providerMessageId: { type: String, default: null, select: false },
    deliveryState: {
      type: String,
      enum: ["SENDING", "SENT", "FAILED"],
      default: "SENDING",
      required: true,
    },
    acceptedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "memberInvitations", bufferCommands: false },
);
schema.index({ tokenHash: 1 }, { unique: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ weddingId: 1, email: 1, createdAt: -1 });
export type TeamInvitationRecord = InferSchemaType<typeof schema>;
export const MemberInvitation: Model<TeamInvitationRecord> =
  mongoose.models.MemberInvitation ??
  mongoose.model("MemberInvitation", schema);
