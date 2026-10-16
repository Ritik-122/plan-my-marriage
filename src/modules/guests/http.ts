import "server-only";
import type { NextRequest } from "next/server";
import { authenticate } from "@/modules/auth/service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import { limitGuestRequests } from "@/modules/auth/rate-limit";
import { assertSameOrigin, readInput } from "@/lib/http/input";
import { HttpError } from "@/lib/http/errors";
import { ConfigurationError } from "@/lib/config/env.server";
import { createRequestContext } from "@/lib/http/request-context";
import { successResponse, errorResponse } from "@/lib/http/responses";
import { logRequest } from "@/lib/logging/logger";
import {
  createGuestSchema,
  updateGuestSchema,
  guestFiltersSchema,
  assignmentSchema,
} from "./schema";
import {
  listGuests,
  getGuest,
  createGuest,
  updateGuest,
  deleteGuest,
  guestEvents,
  assignGuests,
} from "./service";
type Target = {
  weddingId: string;
  guestId?: string;
  eventId?: string;
  guestEvents?: boolean;
};
export async function handleGuest(request: NextRequest, target: Target) {
  const { requestId, startedAt } = createRequestContext();
  const { weddingId, guestId, eventId } = target;
  let response: Response;
  try {
    if (request.method !== "GET") assertSameOrigin(request);
    const user = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user)
      throw new HttpError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    if (request.method !== "GET") await limitGuestRequests(user.id);
    const options = {
      fields: ["name", "email", "phone", "notes", "guestGroupId", "guestIds"],
      maxBytes: 16384,
    };
    if (eventId && request.method !== "GET") {
      const input = await readInput(request, assignmentSchema, options);
      const result = await assignGuests(
        user.id,
        weddingId,
        eventId,
        input.guestIds,
        request.method === "DELETE",
      );
      response =
        request.method === "DELETE"
          ? new Response(null, {
              status: 204,
              headers: {
                "Cache-Control": "no-store",
                "X-Request-Id": requestId,
              },
            })
          : successResponse(result, requestId);
    } else if (target.guestEvents && guestId)
      response = successResponse(
        await guestEvents(user.id, weddingId, guestId),
        requestId,
      );
    else if (request.method === "POST")
      response = successResponse(
        await createGuest(
          user.id,
          weddingId,
          await readInput(request, createGuestSchema, options),
        ),
        requestId,
        { status: 201 },
      );
    else if (request.method === "PATCH" && guestId)
      response = successResponse(
        await updateGuest(
          user.id,
          weddingId,
          guestId,
          await readInput(request, updateGuestSchema, options),
        ),
        requestId,
      );
    else if (request.method === "DELETE" && guestId) {
      await deleteGuest(user.id, weddingId, guestId);
      response = new Response(null, {
        status: 204,
        headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
      });
    } else if (guestId)
      response = successResponse(
        await getGuest(user.id, weddingId, guestId),
        requestId,
      );
    else {
      const parsed = guestFiltersSchema.safeParse({
        ...Object.fromEntries(request.nextUrl.searchParams),
        ...(eventId ? { eventId } : {}),
      });
      if (!parsed.success)
        throw new HttpError(
          400,
          "VALIDATION_ERROR",
          "Check your guest filters. RSVP filtering requires an event.",
        );
      const result = await listGuests(user.id, weddingId, parsed.data);
      response = successResponse(result.data, requestId, {
        nextCursor: result.nextCursor,
      });
    }
  } catch (error) {
    response = errorResponse(
      error instanceof ConfigurationError ||
        (error instanceof Error && /^(Mongo|Mongoose)/.test(error.name))
        ? new HttpError(
            503,
            "PROVIDER_UNAVAILABLE",
            "Guest service is temporarily unavailable. Please try again later.",
          )
        : error,
      requestId,
    );
    if (response.status === 429) response.headers.set("Retry-After", "900");
  }
  const route = eventId
    ? "/api/v1/weddings/:weddingId/events/:eventId/guests"
    : guestId
      ? `/api/v1/weddings/:weddingId/guests/:guestId${target.guestEvents ? "/events" : ""}`
      : "/api/v1/weddings/:weddingId/guests";
  logRequest({
    requestId,
    route,
    method: request.method,
    status: response.status,
    durationMs: performance.now() - startedAt,
  });
  return response;
}
