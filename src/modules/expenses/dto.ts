import type { Types } from "mongoose";
import type { ExpenseRecord } from "./model";
export function expenseDTO(row: ExpenseRecord & { _id: Types.ObjectId }) {
  return {
    id: row._id.toString(),
    weddingId: row.weddingId.toString(),
    eventId: row.eventId?.toString() ?? null,
    name: row.name,
    category: row.category,
    amountPaise: row.amountPaise,
    currency: row.currency,
    expenseDate: row.expenseDate.toISOString(),
    vendorName: row.vendorName,
    paidBy: row.paidBy,
    notes: row.notes,
    createdBy: row.createdBy.toString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
export type ExpenseDTO = ReturnType<typeof expenseDTO>;
export type ExpenseSummary = {
  totalAmountPaise: number;
  currency: "INR";
  count: number;
  byCategory: { category: string; amountPaise: number; count: number }[];
  byEvent: { eventId: string | null; amountPaise: number; count: number }[];
};
