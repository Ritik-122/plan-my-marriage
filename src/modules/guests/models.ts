import "server-only";
import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";
const guestSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, maxlength: 150 },
    email: { type: String, default: "", maxlength: 254 },
    phone: { type: String, default: "", maxlength: 16 },
    notes: { type: String, default: "", maxlength: 2000 },
    guestGroupId: { type: Schema.Types.ObjectId, default: null },
    createdBy: { type: Schema.Types.ObjectId, required: true },
  },
  { collection: "guests", timestamps: true, bufferCommands: false },
);
guestSchema.index({ weddingId: 1, name: 1, _id: 1 });
guestSchema.index({ weddingId: 1, guestGroupId: 1, name: 1 });
guestSchema.index({ weddingId: 1, email: 1 });
const assignment = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true },
    eventId: { type: Schema.Types.ObjectId, required: true },
    guestId: { type: Schema.Types.ObjectId, required: true },
    rsvpStatus: {
      type: String,
      enum: ["PENDING", "ATTENDING", "NOT_ATTENDING"],
      default: "PENDING",
      required: true,
    },
    respondedAt: { type: Date, default: null },
  },
  { collection: "eventGuests", timestamps: true, bufferCommands: false },
);
assignment.index({ eventId: 1, guestId: 1 }, { unique: true });
assignment.index({ weddingId: 1, guestId: 1 });
assignment.index({ weddingId: 1, eventId: 1, rsvpStatus: 1 });
export type GuestRecord = InferSchemaType<typeof guestSchema>;
export const Guest: Model<GuestRecord> =
  mongoose.models.Guest ?? mongoose.model("Guest", guestSchema);
export const EventGuest: Model<InferSchemaType<typeof assignment>> =
  mongoose.models.EventGuest ?? mongoose.model("EventGuest", assignment);
