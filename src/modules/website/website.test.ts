import { describe, expect, it } from "vitest";
import { publicWebsiteDTO, safePublicLink } from "./dto";
import { updateWeddingSchema } from "@/modules/weddings/schema";
import type { EventRecord } from "@/modules/events/model";

describe("website privacy and publishing validation", () => {
  it("allows only explicit publication changes and preserves sparse patches", () => {
    expect(
      updateWeddingSchema.parse({ website: { isPublished: false } }),
    ).toEqual({ website: { isPublished: false } });
    for (const website of [
      {},
      { isPublished: "true" },
      { isPublished: true, showGallery: true },
      { isPublished: true, unknown: 1 },
    ])
      expect(updateWeddingSchema.safeParse({ website }).success).toBe(false);
  });
  it("never serializes private event or organizer fields", () => {
    const wedding = {
      brideName: "Priya",
      groomName: "Ritik",
      weddingDate: new Date("2027-12-12T06:30:00Z"),
      city: "Delhi",
      slug: "ritik-priya",
      theme: "ROYAL_INDIAN" as const,
      description: "Welcome",
      timezone: "Asia/Kolkata",
      createdBy: "private-user",
      website: { isPublished: true },
      secret: "hidden",
    };
    const event = {
      _id: { toString: () => "public-id" },
      name: "Reception",
      type: "RECEPTION",
      startsAt: new Date("2027-12-12T13:30:00Z"),
      endsAt: null,
      visibility: "PUBLIC",
      description: "Dinner",
      dressCode: "Formal",
      venue: { name: "Venue", address: "Delhi", mapUrl: "javascript:alert(1)" },
      createdBy: "private-user",
      weddingId: "private-id",
      livestreamUrl: "https://private-stream.example",
      rsvpStatus: "ATTENDING",
    };
    const result = publicWebsiteDTO(wedding, [
      event,
      { ...event, visibility: "INVITED_ONLY", name: "Secret ceremony" },
    ] as unknown as (EventRecord & { _id: { toString(): string } })[]);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].venue.mapUrl).toBe("");
    const text = JSON.stringify(result);
    for (const secret of [
      "private-user",
      "private-id",
      "Secret ceremony",
      "livestreamUrl",
      "rsvpStatus",
      "createdBy",
      "isPublished",
      "hidden",
    ])
      expect(text).not.toContain(secret);
  });
  it("allows only safe public map links including legacy data", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,hello",
      "//example.com",
      "https://user:password@example.com",
      "invalid",
      null,
    ])
      expect(safePublicLink(url)).toBe("");
    expect(safePublicLink("https://maps.google.com/?q=Delhi")).toBe(
      "https://maps.google.com/?q=Delhi",
    );
  });
});
