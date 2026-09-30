import "server-only";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { defaultTimezone, themes } from "./schema";

const weddingSchema = new Schema(
  {
    brideName: { type: String, required: true, maxlength: 100 },
    groomName: { type: String, required: true, maxlength: 100 },
    weddingDate: { type: Date, required: true },
    city: { type: String, required: true, maxlength: 200 },
    slug: { type: String, required: true, maxlength: 80 },
    theme: { type: String, enum: themes, required: true },
    description: { type: String, default: "", maxlength: 1000 },
    website: {
      isPublished: { type: Boolean, default: false },
      showGallery: { type: Boolean, default: true },
      showLivestream: { type: Boolean, default: true },
    },
    timezone: { type: String, required: true, default: defaultTimezone },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true, collection: "weddings", bufferCommands: false },
);
weddingSchema.index({ slug: 1 }, { unique: true });
weddingSchema.index({ weddingDate: 1 });
const memberSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    role: { type: String, enum: ["ADMIN", "MANAGER"], required: true },
    joinedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: "weddingMembers", bufferCommands: false },
);
memberSchema.index({ weddingId: 1, userId: 1 }, { unique: true });
memberSchema.index({ userId: 1, joinedAt: -1 });
export type WeddingRecord = InferSchemaType<typeof weddingSchema>;
export type MemberRecord = InferSchemaType<typeof memberSchema>;
export const Wedding: Model<WeddingRecord> =
  mongoose.models.Wedding ?? mongoose.model("Wedding", weddingSchema);
export const WeddingMember: Model<MemberRecord> =
  mongoose.models.WeddingMember ??
  mongoose.model("WeddingMember", memberSchema);
