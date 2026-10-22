import "server-only";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { categories, maxRupees } from "./schema";
const schema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true },
    eventId: { type: Schema.Types.ObjectId, default: null },
    name: { type: String, required: true, maxlength: 200 },
    category: { type: String, enum: categories, required: true },
    amountPaise: {
      type: Number,
      required: true,
      min: 0,
      max: maxRupees * 100,
      validate: Number.isSafeInteger,
    },
    currency: { type: String, enum: ["INR"], default: "INR", required: true },
    expenseDate: { type: Date, required: true },
    vendorName: { type: String, default: "", maxlength: 200 },
    paidBy: { type: String, default: "", maxlength: 100 },
    notes: { type: String, default: "", maxlength: 2000 },
    createdBy: { type: Schema.Types.ObjectId, required: true },
  },
  { collection: "expenses", timestamps: true, bufferCommands: false },
);
schema.index({ weddingId: 1, expenseDate: -1, _id: -1 });
schema.index({ weddingId: 1, category: 1 });
schema.index({ weddingId: 1, eventId: 1, expenseDate: -1 });
export type ExpenseRecord = InferSchemaType<typeof schema>;
export const Expense: Model<ExpenseRecord> =
  mongoose.models.Expense ?? mongoose.model("Expense", schema);
