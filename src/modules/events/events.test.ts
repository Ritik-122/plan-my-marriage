import { beforeEach, expect, it, vi } from "vitest";
import {
  createEventSchema,
  updateEventSchema,
  eventFiltersSchema,
  toUTC,
  localDateTime,
} from "./schema";
import { getWedding } from "@/modules/weddings/service";
import {
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  listEvents,
} from "./service";
import * as repository from "./repository";
vi.mock("@/modules/weddings/service", () => ({ getWedding: vi.fn() }));
vi.mock("./repository", () => ({
  createRecord: vi.fn(),
  getRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
  listRecords: vi.fn(),
  missingEvent: () => new Error("Event not found."),
}));
const input = {
  name: "Sangeet",
  type: "SANGEET" as const,
  startsAt: "2027-12-10T13:30:00.000Z",
};
beforeEach(() => vi.clearAllMocks());
it("defaults to invite-only and rejects unsafe fields and links", () => {
  expect(createEventSchema.parse(input).visibility).toBe("INVITED_ONLY");
  expect(
    createEventSchema.safeParse({ ...input, weddingId: "forged" }).success,
  ).toBe(false);
  expect(
    createEventSchema.safeParse({
      ...input,
      venue: { mapUrl: "javascript:alert(1)" },
    }).success,
  ).toBe(false);
  expect(createEventSchema.safeParse({ ...input, name: "  " }).success).toBe(
    false,
  );
});
it("keeps patches sparse and validates chronological ranges", () => {
  expect(updateEventSchema.parse({ name: "New name" })).toEqual({
    name: "New name",
  });
  expect(updateEventSchema.safeParse({}).success).toBe(false);
  expect(
    createEventSchema.safeParse({ ...input, endsAt: input.startsAt }).success,
  ).toBe(false);
  expect(
    eventFiltersSchema.safeParse({
      from: input.startsAt,
      to: "2026-01-01T00:00:00Z",
    }).success,
  ).toBe(false);
});
it("round-trips India time across UTC day boundaries and rejects invalid dates", () => {
  expect(toUTC("2027-12-10T00:15")).toBe("2027-12-09T18:45:00.000Z");
  expect(localDateTime(toUTC("2027-12-10T00:15"))).toBe("2027-12-10T00:15");
  expect(toUTC("2027-02-30T12:00")).toBe("");
  expect(toUTC("2027-12-10T24:15")).toBe("");
});
it("authorizes every event operation before accessing event records", async () => {
  vi.mocked(getWedding).mockRejectedValue(new Error("Wedding not found"));
  const calls = [
    () => listEvents("u", "w"),
    () => getEvent("u", "w", "e"),
    () => createEvent("u", "w", { ...input, visibility: "INVITED_ONLY" }),
    () => updateEvent("u", "w", "e", { name: "new" }),
    () => deleteEvent("u", "w", "e"),
  ];
  for (const call of calls)
    await expect(call()).rejects.toThrow("Wedding not found");
  for (const fn of [
    repository.listRecords,
    repository.getRecord,
    repository.createRecord,
    repository.updateRecord,
    repository.deleteRecord,
  ])
    expect(fn).not.toHaveBeenCalled();
});
