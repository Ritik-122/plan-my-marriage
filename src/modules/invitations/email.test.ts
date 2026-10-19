import { expect, it } from "vitest";
import { guestEmailSchema } from "./email-schema";
import { renderGuestEmail } from "./email-template";
import type { GuestEmailContent } from "./email-dto";
const content: GuestEmailContent = {
  recipient: "guest@example.com",
  guestName: "<Guest>",
  couple: "Bride & Groom",
  subject: "Wedding invitation",
  weddingDate: "12 December 2027",
  city: "<City>",
  greeting: "Hi <Guest>,",
  introduction: "Celebrate & RSVP.",
  events: [
    {
      name: "<script>secret</script>",
      when: "12 Dec 2027 IST",
      venue: 'Venue "A"',
    },
  ],
  expiresAt: "2027-12-20T00:00:00Z",
};
it("renders escaped email HTML and a readable text alternative", () => {
  const result = renderGuestEmail(
    content,
    "https://example.com/guest/invite/token",
  );
  expect(result.html).not.toContain("<script>");
  expect(result.html).toContain("&lt;Guest&gt;");
  expect(result.html).toContain("Bride &amp; Groom");
  expect(result.text).toContain("Hi <Guest>,");
  expect(result.text).toContain("https://example.com/guest/invite/token");
  expect(result.html).not.toContain("guest@example.com");
});
it("handles an empty schedule without inventing events", () => {
  const result = renderGuestEmail(
    { ...content, events: [] },
    "https://example.com/link",
  );
  expect(result.text).toContain("schedule soon");
  expect(result.html).not.toContain("Venue");
});
it("rejects recipient/token overrides and requires an idempotent reviewed request", () => {
  const input = {
    requestId: "c1bc2140-7061-4cf2-9cc3-c50896391472",
    previewHash: "a".repeat(64),
  };
  expect(guestEmailSchema.safeParse(input).success).toBe(true);
  expect(
    guestEmailSchema.safeParse({ ...input, email: "other@example.com" })
      .success,
  ).toBe(false);
  expect(
    guestEmailSchema.safeParse({ ...input, token: "forged" }).success,
  ).toBe(false);
  expect(
    guestEmailSchema.safeParse({ ...input, requestId: "bad" }).success,
  ).toBe(false);
});
