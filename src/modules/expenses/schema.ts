import { z } from "zod";
export const categories = [
  "VENUE",
  "CATERING",
  "DECORATION",
  "PHOTOGRAPHY",
  "VIDEOGRAPHY",
  "CLOTHING",
  "JEWELLERY",
  "MAKEUP",
  "MEHENDI",
  "ENTERTAINMENT",
  "INVITATIONS",
  "TRAVEL",
  "ACCOMMODATION",
  "GIFTS",
  "OTHER",
] as const;
export const categoryLabel = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase();
export const maxRupees = 1_000_000_000;
export function toPaise(amount: number) {
  const [whole, fraction = ""] = String(amount).split(".");
  return Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0")));
}
export const amountSchema = z
  .number()
  .min(0)
  .max(maxRupees)
  .refine(
    (v) => /^\d+(?:\.\d{1,2})?$/.test(String(v)),
    "Use an amount with at most two decimal places.",
  );
const id = z.string().regex(/^[a-f\d]{24}$/i);
const date = z.iso.datetime({ offset: true });
export const createExpenseSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    category: z.enum(categories),
    amount: amountSchema,
    date,
    eventId: id.nullable().optional(),
    vendorName: z.string().trim().max(200).optional(),
    paidBy: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();
export const updateExpenseSchema = createExpenseSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Provide a field to update.");
export const expenseFiltersSchema = z
  .object({
    category: z.enum(categories).optional(),
    eventId: z.union([id, z.literal("general")]).optional(),
    dateFrom: date.optional(),
    dateTo: date.optional(),
    cursor: z.string().min(1).max(500).optional(),
    q: z.string().trim().max(200).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine(
    (v) =>
      !v.dateFrom ||
      !v.dateTo ||
      Date.parse(v.dateFrom) <= Date.parse(v.dateTo),
    "Check the date range.",
  );
export const expenseCursorSchema = z.object({ date, id }).strict();
export type ExpenseInput = z.infer<typeof createExpenseSchema>;
export type ExpenseUpdate = z.infer<typeof updateExpenseSchema>;
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>;
