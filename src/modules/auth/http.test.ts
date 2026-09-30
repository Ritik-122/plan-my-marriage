import { expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { assertSameOrigin, handleAuth, readInput } from "./http";
import { loginSchema } from "./schema";
import { clientIdentity } from "./rate-limit";

vi.mock("@/lib/logging/logger", () => ({ logRequest: vi.fn() }));
it("rejects cross-origin and missing-origin mutations, accepting only configured origin", () => {
  vi.stubEnv("APP_BASE_URL", "https://plan.example.com");
  const cases: Record<string, string>[] = [
    { Origin: "https://attacker.example" },
    {},
    { Origin: "null" },
    { Origin: "https://plan.example.com", "Sec-Fetch-Site": "cross-site" },
  ];
  for (const headers of cases) {
    expect(() =>
      assertSameOrigin(new Request("https://plan.example.com", { headers })),
    ).toThrow("not allowed");
  }
  expect(() =>
    assertSameOrigin(
      new Request("https://internal.example", {
        headers: { Origin: "https://plan.example.com" },
      }),
    ),
  ).not.toThrow();
  expect(() =>
    assertSameOrigin(
      new Request("https://plan.example.com", {
        headers: { Referer: "https://plan.example.com/sign-in" },
      }),
    ),
  ).not.toThrow();
});
it("bounds actual request bytes and rejects malformed JSON", async () => {
  for (const body of [
    "{",
    JSON.stringify({ email: "r@example.com", password: "x".repeat(4096) }),
  ]) {
    await expect(
      readInput(
        new Request("http://localhost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }),
        loginSchema,
      ),
    ).rejects.toMatchObject({ status: 400 });
  }
});
it("does not trust caller-provided forwarding headers outside Vercel", () => {
  vi.stubEnv("VERCEL", "");
  expect(
    clientIdentity(
      new Request("http://localhost", {
        headers: { "x-forwarded-for": "1.2.3.4" },
      }),
    ),
  ).toBe(clientIdentity(new Request("http://localhost")));
});
it("clears the cookie even when account storage is unavailable", async () => {
  vi.stubEnv("APP_BASE_URL", "https://plan.example.com");
  vi.stubEnv("MONGODB_URI", "");
  const response = await handleAuth(
    new NextRequest("https://plan.example.com/api/v1/auth/logout", {
      method: "POST",
      headers: { Origin: "https://plan.example.com" },
    }),
    "logout",
  );
  expect(response.status).toBe(204);
  expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  expect(response.headers.get("set-cookie")).toContain("Secure");
});
it("returns a safe unavailable response before using unconfigured storage", async () => {
  vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
  vi.stubEnv("MONGODB_URI", "");
  vi.stubEnv("SESSION_SECRET", "a".repeat(48));
  const response = await handleAuth(
    new NextRequest("http://localhost:3000/api/v1/auth/register", {
      method: "POST",
      headers: { Origin: "http://localhost:3000" },
    }),
    "register",
  );
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("MONGODB_URI");
});
