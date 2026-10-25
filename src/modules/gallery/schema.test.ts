import { describe, expect, it } from "vitest";
import {
  presignSchema,
  finalizeSchema,
  photoFiltersSchema,
  imageSignatureMatches,
} from "./schema";
const eventId = "a".repeat(24);
const input = {
  purpose: "EVENT_GALLERY",
  eventId,
  fileName: "ceremony.png",
  mimeType: "image/png",
  sizeBytes: 100,
};
describe("gallery input", () => {
  it("requires matching event scope, bounded image files and no forged fields", () => {
    expect(presignSchema.safeParse(input).success).toBe(true);
    for (const changes of [
      { eventId: null },
      { purpose: "WEDDING_GALLERY" },
      { mimeType: "image/svg+xml" },
      { sizeBytes: 10485761 },
      { sizeBytes: 0 },
      { fileName: "bad\nname.png" },
      { uploadedByType: "ADMIN" },
      { objectKey: "chosen" },
    ])
      expect(presignSchema.safeParse({ ...input, ...changes }).success).toBe(
        false,
      );
    expect(
      presignSchema.safeParse({
        ...input,
        purpose: "WEDDING_GALLERY",
        eventId: null,
      }).success,
    ).toBe(true);
  });
  it("rejects arbitrary final URLs, traversal, unsupported purposes and unbounded pages", () => {
    const data = {
      purpose: "WEDDING_GALLERY",
      eventId: null,
      objectKey: `weddings/${eventId}/photos/00000000-0000-0000-0000-000000000000.png`,
      originalFileName: "a.png",
    };
    expect(finalizeSchema.safeParse(data).success).toBe(true);
    for (const objectKey of [
      "https://example.org/photo.png",
      "../photo.png",
      `staging/${eventId}/a.png`,
    ])
      expect(finalizeSchema.safeParse({ ...data, objectKey }).success).toBe(
        false,
      );
    expect(
      finalizeSchema.safeParse({ ...data, purpose: "WEDDING_COVER" }).success,
    ).toBe(false);
    expect(photoFiltersSchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(photoFiltersSchema.parse({ eventId: "general" }).limit).toBe(24);
  });
  it("checks signatures independently of file extension or claimed MIME", () => {
    const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(imageSignatureMatches(png, "image/png")).toBe(true);
    expect(imageSignatureMatches(png, "image/jpeg")).toBe(false);
    expect(
      imageSignatureMatches(new TextEncoder().encode("<svg>"), "image/png"),
    ).toBe(false);
    expect(
      imageSignatureMatches(Uint8Array.from([255, 216, 255]), "image/jpeg"),
    ).toBe(true);
    expect(
      imageSignatureMatches(
        new TextEncoder().encode("RIFF1234WEBP"),
        "image/webp",
      ),
    ).toBe(true);
  });
});
