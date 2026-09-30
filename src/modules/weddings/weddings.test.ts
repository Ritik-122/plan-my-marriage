import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createWeddingSchema,
  updateWeddingSchema,
  dateInputToISO,
  dateForInput,
  suggestSlug,
} from "./schema";
import {
  createWedding,
  getWedding,
  updateWedding,
  listWeddings,
} from "./service";
import * as repository from "./repository";
vi.mock("./repository", () => ({
  memberships: vi.fn(),
  findWeddings: vi.fn(),
  findMembership: vi.fn(),
  findWedding: vi.fn(),
  createWithAdmin: vi.fn(),
  updateWeddingRecord: vi.fn(),
}));
const weddingId = "68d0b0010000000000000001",
  userId = "68d0a0010000000000000001";
const input = {
  brideName: "Priya",
  groomName: "Ritik",
  weddingDate: "2027-02-14T06:30:00.000Z",
  city: "Delhi",
  slug: "ritik-priya",
  theme: "CLASSIC_INDIAN" as const,
  description: "Our celebration",
};
beforeEach(() => vi.resetAllMocks());
describe("wedding input", () => {
  it("normalizes names and slug, rejects injected ownership/publishing and invalid dates", () => {
    expect(
      createWeddingSchema.parse({
        ...input,
        brideName: " Priya ",
        slug: " RITIK-PRIYA ",
      }),
    ).toMatchObject({ brideName: "Priya", slug: "ritik-priya" });
    for (const extra of [
      { createdBy: userId },
      { role: "ADMIN" },
      { website: { isPublished: true } },
      { timezone: "UTC" },
      { weddingDate: "2027-02-30T06:30:00Z" },
      { slug: "bad/slug" },
      { theme: "UNKNOWN" },
    ])
      expect(
        createWeddingSchema.safeParse({ ...input, ...extra }).success,
      ).toBe(false);
  });
  it("keeps PATCH sparse, rejects empty changes and immutable slugs", () => {
    expect(updateWeddingSchema.parse({ theme: "ROYAL_INDIAN" })).toEqual({
      theme: "ROYAL_INDIAN",
    });
    expect(updateWeddingSchema.safeParse({}).success).toBe(false);
    expect(updateWeddingSchema.safeParse({ slug: "new-slug" }).success).toBe(
      false,
    );
  });
  it("round trips dates in India and rejects nonexistent calendar dates", () => {
    for (const date of ["2027-02-14", "2028-02-29", "2027-12-31"])
      expect(dateForInput(dateInputToISO(date))).toBe(date);
    expect(dateInputToISO("2027-02-29")).toBe("");
    expect(dateInputToISO("")).toBe("");
    expect(suggestSlug("Príya", "Ritik Sharma")).toBe(
      "ritik-sharma-weds-priya",
    );
  });
});
describe("wedding access", () => {
  it("does not load or mutate wedding records without membership", async () => {
    vi.mocked(repository.findMembership).mockResolvedValue(null);
    await expect(getWedding(userId, weddingId)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      updateWedding(userId, weddingId, { city: "Jaipur" }),
    ).rejects.toMatchObject({ status: 404 });
    expect(repository.findWedding).not.toHaveBeenCalled();
    expect(repository.updateWeddingRecord).not.toHaveBeenCalled();
  });
  it("rejects malformed IDs before database reads", async () => {
    await expect(getWedding(userId, "invalid")).rejects.toMatchObject({
      status: 404,
    });
    expect(repository.findMembership).not.toHaveBeenCalled();
  });
  it("derives list scope from membership", async () => {
    vi.mocked(repository.memberships).mockResolvedValue([]);
    vi.mocked(repository.findWeddings).mockResolvedValue([]);
    expect(await listWeddings(userId)).toEqual([]);
    expect(repository.findWeddings).toHaveBeenCalledWith([]);
  });
  it("maps concurrent unique-slug conflicts to 409", async () => {
    vi.mocked(repository.createWithAdmin).mockRejectedValue({ code: 11000 });
    await expect(createWedding(userId, input)).rejects.toMatchObject({
      status: 409,
      code: "CONFLICT",
      fields: { slug: expect.any(String) },
    });
  });
});
