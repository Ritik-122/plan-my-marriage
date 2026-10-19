import "server-only";
import type { NextRequest } from "next/server";
import { authenticate } from "@/modules/auth/service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import { limitGuestEmailRequests } from "@/modules/auth/rate-limit";
import { assertSameOrigin, readInput } from "@/lib/http/input";
import { HttpError } from "@/lib/http/errors";
import { ConfigurationError } from "@/lib/config/env.server";
import { createRequestContext } from "@/lib/http/request-context";
import { successResponse, errorResponse } from "@/lib/http/responses";
import { logRequest } from "@/lib/logging/logger";
import { guestEmailSchema } from "./email-schema";
import { emailGuest, guestEmailState } from "./email-service";
export async function handleGuestEmail(
  request: NextRequest,
  target: { weddingId: string; guestId: string },
) {
  const { requestId, startedAt } = createRequestContext();
  let response: Response;
  try {
    if (request.method !== "GET") assertSameOrigin(request);
    const user = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user)
      throw new HttpError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    if (request.method === "GET")
      response = successResponse(
        await guestEmailState(user.id, target.weddingId, target.guestId),
        requestId,
      );
    else {
      await limitGuestEmailRequests(user.id);
      const input = await readInput(request, guestEmailSchema, {
        fields: ["requestId", "previewHash"],
        maxBytes: 1024,
      });
      response = successResponse(
        await emailGuest(user.id, target.weddingId, target.guestId, input),
        requestId,
        { status: 202 },
      );
    }
  } catch (error) {
    response = errorResponse(
      error instanceof ConfigurationError ||
        (error instanceof Error && /^(Mongo|Mongoose)/.test(error.name))
        ? new HttpError(
            503,
            "PROVIDER_UNAVAILABLE",
            "Invitation email service is unavailable. Check the configuration or try again later.",
          )
        : error,
      requestId,
    );
    if (response.status === 429) response.headers.set("Retry-After", "900");
  }
  logRequest({
    requestId,
    route: "/api/v1/weddings/:weddingId/guests/:guestId/invitations/email",
    method: request.method,
    status: response.status,
    durationMs: performance.now() - startedAt,
  });
  return response;
}
