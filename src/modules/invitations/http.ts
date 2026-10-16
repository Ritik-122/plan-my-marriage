import "server-only";
import type { NextRequest } from "next/server";
import { authenticate } from "@/modules/auth/service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import {
  limitGuestRequests,
  limitInvitationRead,
  limitInvitationCreation,
} from "@/modules/auth/rate-limit";
import { assertSameOrigin, readInput } from "@/lib/http/input";
import { HttpError } from "@/lib/http/errors";
import { ConfigurationError } from "@/lib/config/env.server";
import { createRequestContext } from "@/lib/http/request-context";
import { successResponse, errorResponse } from "@/lib/http/responses";
import { logRequest } from "@/lib/logging/logger";
import { createLinkSchema } from "./schema";
import { createLink, listLinks, revokeLink, readInvitation } from "./service";
type Target = { weddingId: string; guestId: string; accessTokenId?: string };
export async function handleInvitation(request: NextRequest, target?: Target) {
  const { requestId, startedAt } = createRequestContext();
  let response: Response;
  try {
    if (!target) {
      await limitInvitationRead(request);
      const token =
        /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(
          request.headers.get("authorization") ?? "",
        )?.[1] ?? "";
      response = successResponse(await readInvitation(token), requestId);
    } else {
      if (request.method !== "GET") assertSameOrigin(request);
      const user = await authenticate(
        request.cookies.get(SESSION_COOKIE)?.value,
      );
      if (!user)
        throw new HttpError(
          401,
          "AUTH_REQUIRED",
          "Please sign in to continue.",
        );
      const { weddingId, guestId, accessTokenId } = target;
      if (request.method === "POST") {
        await limitInvitationCreation(user.id);
        const input = await readInput(request, createLinkSchema, {
          fields: ["expiresAt"],
          maxBytes: 1024,
        });
        response = successResponse(
          await createLink(user.id, weddingId, guestId, input.expiresAt),
          requestId,
          { status: 201 },
        );
      } else if (request.method === "DELETE" && accessTokenId) {
        await limitGuestRequests(user.id);
        await revokeLink(user.id, weddingId, guestId, accessTokenId);
        response = new Response(null, {
          status: 204,
          headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
        });
      } else
        response = successResponse(
          await listLinks(user.id, weddingId, guestId),
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
            "Invitations are temporarily unavailable. Please try again later.",
          )
        : error,
      requestId,
    );
    if (response.status === 429) response.headers.set("Retry-After", "900");
  }
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  logRequest({
    requestId,
    route: target
      ? "/api/v1/weddings/:weddingId/guests/:guestId/access-links/:accessTokenId?"
      : "/api/v1/guest/invitation",
    method: request.method,
    status: response.status,
    durationMs: performance.now() - startedAt,
  });
  return response;
}
