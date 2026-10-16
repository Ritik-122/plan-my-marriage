import { beforeEach, expect, it, vi } from "vitest";
import {
  createGuestSchema,
  updateGuestSchema,
  assignmentSchema,
  guestFiltersSchema,
} from "./schema";
import { getWedding } from "@/modules/weddings/service";
import { getEvent } from "@/modules/events/service";
import {
  getGuest,
  createGuest,
  updateGuest,
  deleteGuest,
  guestEvents,
  assignGuests,
  listGuests,
} from "./service";
import * as repository from "./repository";
vi.mock("@/modules/weddings/service", () => ({ getWedding: vi.fn() }));
vi.mock("@/modules/events/service", () => ({ getEvent: vi.fn() }));
vi.mock("./repository", () => ({
  listRecords: vi.fn(),
  getRecord: vi.fn(),
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
  assignedEvents: vi.fn(),
  changeAssignments: vi.fn(),
  missingGuest: () => new Error("Guest not found"),
}));
beforeEach(() => vi.clearAllMocks());
it("normalizes optional contacts and allows name-only guests", () => {
  expect(
    createGuestSchema.parse({
      name: "  Rajesh  ",
      email: " RAJ@EXAMPLE.COM ",
      phone: "+91 (98765) 43210",
    }),
  ).toEqual({
    name: "Rajesh",
    email: "raj@example.com",
    phone: "+919876543210",
  });
  expect(createGuestSchema.parse({ name: "Rajesh" })).toEqual({
    name: "Rajesh",
  });
  expect(
    createGuestSchema.safeParse({ name: "Raj", phone: "letters" }).success,
  ).toBe(false);
  expect(
    createGuestSchema.safeParse({ name: "Raj", email: "bad" }).success,
  ).toBe(false);
});
it("keeps patches sparse and rejects overposting", () => {
  expect(updateGuestSchema.parse({ notes: "" })).toEqual({ notes: "" });
  expect(updateGuestSchema.safeParse({}).success).toBe(false);
  for (const key of [
    "weddingId",
    "createdBy",
    "password",
    "rsvpStatus",
    "eventIds",
  ])
    expect(
      createGuestSchema.safeParse({ name: "Raj", [key]: "forged" }).success,
    ).toBe(false);
});
it("validates filters and deduplicates assignment IDs", () => {
  const id = "68d0b0010000000000000001";
  expect(assignmentSchema.parse({ guestIds: [id, id] }).guestIds).toEqual([id]);
  expect(assignmentSchema.safeParse({ guestIds: [] }).success).toBe(false);
  expect(guestFiltersSchema.safeParse({ limit: 101 }).success).toBe(false);
  expect(
    guestFiltersSchema.safeParse({ rsvpStatus: "ATTENDING" }).success,
  ).toBe(false);
  expect(guestFiltersSchema.parse({ q: " Raj " }).q).toBe("Raj");
});
it("checks membership before every guest read and write", async () => {
  vi.mocked(getWedding).mockRejectedValue(new Error("Denied"));
  for (const call of [
    () => getGuest("u", "w", "g"),
    () => createGuest("u", "w", { name: "Raj" }),
    () => updateGuest("u", "w", "g", { name: "R" }),
    () => deleteGuest("u", "w", "g"),
    () => guestEvents("u", "w", "g"),
    () => listGuests("u", "w", { limit: 20 }),
  ])
    await expect(call()).rejects.toThrow("Denied");
  for (const fn of [
    repository.getRecord,
    repository.createRecord,
    repository.updateRecord,
    repository.deleteRecord,
    repository.assignedEvents,
    repository.listRecords,
  ])
    expect(fn).not.toHaveBeenCalled();
});
it("authorizes the event before changing its assignments", async () => {
  vi.mocked(getEvent).mockRejectedValue(new Error("Denied"));
  await expect(
    assignGuests("u", "w", "e", ["68d0b0010000000000000001"]),
  ).rejects.toThrow("Denied");
  expect(repository.changeAssignments).not.toHaveBeenCalled();
});
