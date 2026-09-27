import { expect, it, vi } from "vitest";

vi.mock("@/lib/db/mongoose", () => {
  throw new Error("Health must not import database capability");
});
vi.mock("@/lib/logging/logger", () => ({ logRequest: vi.fn() }));

import { GET } from "./route";

it("returns liveness only with a fresh request ID", async () => {
  const response = GET();
  const body = await response.json();
  const second = await GET().json();
  expect(response.status).toBe(200);
  expect(body).toEqual({
    data: { status: "ok" },
    meta: { requestId: expect.stringMatching(/^req_[0-9a-f-]{36}$/) },
  });
  expect(body.meta.requestId).not.toBe(second.meta.requestId);
  expect(response.headers.get("x-request-id")).toBe(body.meta.requestId);
  expect(response.headers.get("cache-control")).toBe("no-store");
});
