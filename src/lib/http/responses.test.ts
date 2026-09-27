import { describe, expect, it } from "vitest";
import { HttpError } from "./errors";
import { errorResponse, successResponse } from "./responses";

describe("API response contract", () => {
  it("returns data and pagination inside the documented envelope", async () => {
    const response = successResponse([], "req_test", { nextCursor: null });
    expect(await response.json()).toEqual({
      data: [],
      meta: { requestId: "req_test", nextCursor: null },
    });
    expect(response.headers.get("x-request-id")).toBe("req_test");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("preserves safe validation errors", async () => {
    const response = errorResponse(
      new HttpError(400, "VALIDATION_ERROR", "Check your input.", {
        email: "Enter a valid email.",
      }),
      "req_test",
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Check your input.",
        fields: { email: "Enter a valid email." },
      },
      meta: { requestId: "req_test" },
    });
  });

  it("does not serialize unexpected error details", async () => {
    const response = errorResponse(
      new Error("mongodb://user:secret@host/database"),
      "req_test",
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
      },
      meta: { requestId: "req_test" },
    });
  });
});
