import "server-only";
import type { NextRequest } from "next/server";
import { authenticate } from "@/modules/auth/service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import { limitEventRequests } from "@/modules/auth/rate-limit";
import { assertSameOrigin, readInput } from "@/lib/http/input";
import { HttpError } from "@/lib/http/errors";
import { ConfigurationError } from "@/lib/config/env.server";
import { createRequestContext } from "@/lib/http/request-context";
import { successResponse, errorResponse } from "@/lib/http/responses";
import { logRequest } from "@/lib/logging/logger";
import {
  createEventSchema,
  updateEventSchema,
  eventFiltersSchema,
} from "./schema";
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "./service";
export async function handleEvent(
  request: NextRequest,
  weddingId: string,
  eventId?: string,
) {
  const { requestId, startedAt } = createRequestContext();
  let response: Response;
  try {
    if (request.method !== "GET") assertSameOrigin(request);
    const user = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user)
      throw new HttpError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    if (request.method !== "GET") await limitEventRequests(user.id);
    const options = {
      fields: [
        "name",
        "type",
        "startsAt",
        "endsAt",
        "description",
        "dressCode",
        "venue",
        "livestreamUrl",
        "visibility",
      ],
      maxBytes: 16384,
    };
    if (request.method === "POST")
      response = successResponse(
        await createEvent(
          user.id,
          weddingId,
          await readInput(request, createEventSchema, options),
        ),
        requestId,
        { status: 201 },
      );
    else if (request.method === "PATCH" && eventId)
      response = successResponse(
        await updateEvent(
          user.id,
          weddingId,
          eventId,
          await readInput(request, updateEventSchema, options),
        ),
        requestId,
      );
    else if (request.method === "DELETE" && eventId) {
      await deleteEvent(user.id, weddingId, eventId);
      response = new Response(null, {
        status: 204,
        headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
      });
    } else if (eventId)
      response = successResponse(
        await getEvent(user.id, weddingId, eventId),
        requestId,
      );
    else {
      const parsed = eventFiltersSchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      if (!parsed.success)
        throw new HttpError(
          400,
          "VALIDATION_ERROR",
          "Use valid from/to timestamps in chronological order.",
        );
      response = successResponse(
        await listEvents(user.id, weddingId, parsed.data),
        requestId,
      );
    }
  } catch (error) {
    response = errorResponse(
      error instanceof ConfigurationError ||
        (error instanceof Error && /^(Mongo|Mongoose)/.test(error.name))
        ? new HttpError(
            503,
            "PROVIDER_UNAVAILABLE",
            "Event service is temporarily unavailable. Please try again later.",
          )
        : error,
      requestId,
    );
    if (response.status === 429) response.headers.set("Retry-After", "900");
  }
  logRequest({
    requestId,
    route: eventId
      ? "/api/v1/weddings/:weddingId/events/:eventId"
      : "/api/v1/weddings/:weddingId/events",
    method: request.method,
    status: response.status,
    durationMs: performance.now() - startedAt,
  });
  return response;
}
