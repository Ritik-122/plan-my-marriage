import { describe, expect, it } from "vitest";
import { createToken, hashToken, tokenPattern } from "./token";
import { createLinkSchema, rsvpSchema } from "./schema";
describe("RSVP validation", () => {
  const eventId = "a".repeat(24);
  it("accepts only explicit per-event attendance choices", () => {
    expect(
      rsvpSchema.safeParse({ responses: [{ eventId, status: "ATTENDING" }] })
        .success,
    ).toBe(true);
    for (const input of [
      { responses: [] },
      { responses: [{ eventId, status: "PENDING" }] },
      { responses: [{ eventId: "bad", status: "ATTENDING" }] },
      { responses: [{ eventId, status: "ATTENDING", guestCount: 3 }] },
      { responses: [{ eventId, status: "ATTENDING" }], guestId: eventId },
    ])
      expect(rsvpSchema.safeParse(input).success).toBe(false);
  });
  it("rejects duplicate event IDs including differently cased IDs and bounds batches", () => {
    expect(
      rsvpSchema.safeParse({
        responses: [
          { eventId, status: "ATTENDING" },
          { eventId: eventId.toUpperCase(), status: "NOT_ATTENDING" },
        ],
      }).success,
    ).toBe(false);
    expect(
      rsvpSchema.safeParse({
        responses: Array.from({ length: 101 }, (_, i) => ({
          eventId: i.toString(16).padStart(24, "0"),
          status: "ATTENDING",
        })),
      }).success,
    ).toBe(false);
  });
});
describe("private invitation tokens", () => {
  it("creates distinct 256-bit tokens and stores only a SHA-256 digest", () => {
    const a = createToken();
    const b = createToken();
    expect(a.token).not.toBe(b.token);
    expect(tokenPattern.test(a.token)).toBe(true);
    expect(Buffer.from(a.token, "base64url")).toHaveLength(32);
    expect(a.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(a.token)).toBe(a.tokenHash);
    expect(a.tokenHash).not.toContain(a.token);
  });
  it("requires a future explicit expiration and rejects unknown fields", () => {
    const expiresAt = new Date(Date.now() + 86400000).toISOString();
    expect(createLinkSchema.safeParse({ expiresAt }).success).toBe(true);
    for (const input of [
      {},
      { expiresAt: "bad" },
      { expiresAt: "2020-01-01T00:00:00Z" },
      { expiresAt, guestId: "other" },
    ])
      expect(createLinkSchema.safeParse(input).success).toBe(false);
  });
  it("rejects malformed capability values before database access", () => {
    for (const value of [
      "",
      "a".repeat(42),
      "a".repeat(44),
      "/".repeat(43),
      " ".repeat(43),
    ])
      expect(tokenPattern.test(value)).toBe(false);
  });
});
