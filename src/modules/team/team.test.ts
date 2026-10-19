import { afterEach, expect, it, vi } from "vitest";
import { inviteSchema, acceptSchema } from "./schema";
import { escapeHtml, sendTeamEmail } from "@/lib/email/resend";
import { getEmailConfig } from "@/lib/config/env.server";
afterEach(() => vi.unstubAllGlobals());
it.each([
  [
    403,
    "validation_error",
    "You can only send testing emails to your own email address (private@example.com).",
    "test sender can only invite",
  ],
  [
    403,
    "validation_error",
    "The private.example domain is not verified.",
    "not verified the sending domain",
  ],
  [401, "validation_error", "API key is invalid", "rejected the email API key"],
  [403, "restricted_api_key", "API key is not active", "sending permissions"],
  [
    429,
    "daily_quota_exceeded",
    "Private account quota details",
    "sending quota",
  ],
  [429, "rate_limit_exceeded", "Private rate details", "rate limiting"],
  [422, "validation_error", "Private invalid sender", "email settings"],
  [403, "validation_error", "Unknown private restriction", "Resend Logs"],
  [
    503,
    "service_unavailable",
    "Private provider failure",
    "could not be confirmed",
  ],
])(
  "classifies Resend %s/%s without leaking provider details",
  async (status, name, message, expected) => {
    vi.stubEnv("RESEND_API_KEY", "private-key");
    vi.stubEnv("EMAIL_FROM", "Planner <test@example.com>");
    vi.stubEnv("EMAIL_REPLY_TO", "");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ name, message }, { status })),
    );
    const error = await sendTeamEmail({
      email: "invite@example.com",
      couple: "Couple",
      role: "ADMIN",
      url: "https://example.com/#token",
      id: "test",
    }).catch((error) => error);
    expect(error).toMatchObject({ status: 502, code: "EMAIL_DELIVERY_FAILED" });
    expect(error.message).toContain(expected);
    expect(error.message).not.toContain(message);
    expect(error.message).not.toContain("private@example.com");
  },
);
it("normalizes invite emails, allows co-admins, and rejects forged fields", () => {
  expect(
    inviteSchema.parse({ email: "PARTNER@example.com", role: "ADMIN" }).email,
  ).toBe("partner@example.com");
  expect(inviteSchema.parse({ email: "manager@example.com" }).role).toBe(
    "MANAGER",
  );
  expect(
    inviteSchema.safeParse({ email: "a@example.com", role: "OWNER" }).success,
  ).toBe(false);
  expect(
    acceptSchema.safeParse({ token: "a".repeat(43), role: "ADMIN" }).success,
  ).toBe(false);
});
it("validates email configuration without revealing secrets", () => {
  expect(() =>
    getEmailConfig({ RESEND_API_KEY: "secret", EMAIL_FROM: "bad\r\nvalue" }),
  ).toThrow("EMAIL_FROM");
  expect(escapeHtml('<x a="b">&\'')).toBe(
    "&lt;x a=&quot;b&quot;&gt;&amp;&#39;",
  );
});
it("uses Resend idempotency and sanitizes provider errors", async () => {
  vi.stubEnv("RESEND_API_KEY", "private-key");
  vi.stubEnv("EMAIL_FROM", "Planner <test@example.com>");
  vi.stubEnv("EMAIL_REPLY_TO", "");
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: "mail-id" }));
  vi.stubGlobal("fetch", fetchMock);
  const input = {
    email: "invite@example.com",
    couple: "<script> & Groom",
    role: "ADMIN",
    url: "https://example.com/member-invitations/accept#token",
    id: "invitation-id",
  };
  expect(await sendTeamEmail(input)).toBe("mail-id");
  const options = fetchMock.mock.calls[0][1];
  expect(options.headers["Idempotency-Key"]).toBe(
    "team-invitation/invitation-id",
  );
  expect(JSON.parse(options.body).html).not.toContain("<script>");
  expect(JSON.parse(options.body).text).toContain("Admin");
  fetchMock.mockResolvedValue(
    Response.json({ message: "private-provider-information" }, { status: 403 }),
  );
  await expect(sendTeamEmail(input)).rejects.toMatchObject({
    status: 502,
    code: "EMAIL_DELIVERY_FAILED",
  });
  fetchMock.mockRejectedValue(new Error("secret transport error"));
  await expect(sendTeamEmail(input)).rejects.toThrow(
    "Email sending could not be confirmed",
  );
});
