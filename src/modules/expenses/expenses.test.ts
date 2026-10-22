import { describe, expect, it } from "vitest";
import {
  amountSchema,
  createExpenseSchema,
  updateExpenseSchema,
  expenseFiltersSchema,
  toPaise,
} from "./schema";
import { calendarDate, money } from "@/components/expenses/presentation";
describe("expense precision and contracts", () => {
  it("converts rupees to exact integer paise", () => {
    for (const [rupees, paise] of [
      [0, 0],
      [0.01, 1],
      [0.29, 29],
      [1.01, 101],
      [80000.5, 8000050],
      [1000000000, 100000000000],
    ])
      expect(toPaise(amountSchema.parse(rupees))).toBe(paise);
    for (const value of [-1, 1.001, NaN, Infinity, 1e-7, 1000000001, "800"])
      expect(amountSchema.safeParse(value).success).toBe(false);
  });
  it("allows only V1 fields, valid dates and known categories", () => {
    const input = {
      name: " Photo ",
      category: "PHOTOGRAPHY",
      amount: 800.5,
      date: "2027-02-01T00:00:00+05:30",
    };
    expect(createExpenseSchema.parse(input).name).toBe("Photo");
    for (const extra of [
      { amountPaise: 50 },
      { currency: "USD" },
      { budget: 1000 },
      { createdBy: "forged" },
    ])
      expect(
        createExpenseSchema.safeParse({ ...input, ...extra }).success,
      ).toBe(false);
    expect(
      createExpenseSchema.safeParse({ ...input, date: "2027-02-30" }).success,
    ).toBe(false);
    expect(
      createExpenseSchema.safeParse({ ...input, category: "INVALID" }).success,
    ).toBe(false);
  });
  it("keeps updates sparse and supports clearing optional fields", () => {
    expect(updateExpenseSchema.parse({ name: "Updated" })).toEqual({
      name: "Updated",
    });
    expect(
      updateExpenseSchema.parse({
        eventId: null,
        notes: "",
        paidBy: "",
        vendorName: "",
      }),
    ).toEqual({ eventId: null, notes: "", paidBy: "", vendorName: "" });
    expect(updateExpenseSchema.safeParse({}).success).toBe(false);
    expect(
      expenseFiltersSchema.safeParse({
        dateFrom: "2027-02-01T00:00:00Z",
        dateTo: "2027-01-01T00:00:00Z",
      }).success,
    ).toBe(false);
    expect(expenseFiltersSchema.safeParse({ limit: 101 }).success).toBe(false);
  });
  it("displays Indian amounts and calendar dates without timezone drift", () => {
    expect(money(8000050)).toContain("80,000.50");
    expect(calendarDate("2027-01-31T18:30:00Z")).toBe("2027-02-01");
  });
});
