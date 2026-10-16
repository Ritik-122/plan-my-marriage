import "server-only";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { eventTypes } from "./schema";
const schema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, maxlength: 150 },
    type: { type: String, enum: eventTypes, required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, default: null },
    description: { type: String, default: "", maxlength: 2000 },
    dressCode: { type: String, default: "", maxlength: 200 },
    venue: {
      name: { type: String, default: "" },
      address: { type: String, default: "" },
      mapUrl: { type: String, default: "" },
    },
    livestreamUrl: { type: String, default: null },
    visibility: {
      type: String,
      enum: ["PUBLIC", "INVITED_ONLY"],
      default: "INVITED_ONLY",
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, required: true },
  },
  { collection: "events", timestamps: true, bufferCommands: false },
);
schema.index({ weddingId: 1, startsAt: 1 });
export type EventRecord = InferSchemaType<typeof schema>;
export const WeddingEvent: Model<EventRecord> =
  mongoose.models.WeddingEvent ?? mongoose.model("WeddingEvent", schema);
