import "server-only";
import type { NextRequest } from "next/server";
import { authenticate } from "@/modules/auth/service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import { ConfigurationError } from "@/lib/config/env.server";
import { HttpError } from "@/lib/http/errors";
import { createRequestContext } from "@/lib/http/request-context";
import { successResponse, errorResponse } from "@/lib/http/responses";
import { logRequest } from "@/lib/logging/logger";
import { previewWebsite, publicWebsite } from "./service";

export async function handleWebsite(
  request: NextRequest,
  identifier: string,
  preview = false,
) {
  const { requestId, startedAt } = createRequestContext();
  let response: Response;
  try {
    let user;
    if (preview) {
      user = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
      if (!user)
        throw new HttpError(
          401,
          "AUTH_REQUIRED",
          "Please sign in to continue.",
        );
    }
    response = successResponse(
      user
        ? await previewWebsite(user.id, identifier)
        : await publicWebsite(identifier),
      requestId,
    );
  } catch (e) {
    response = errorResponse(
      e instanceof ConfigurationError ||
        (e instanceof Error && /^(Mongo|Mongoose)/.test(e.name))
        ? new HttpError(
            503,
            "PROVIDER_UNAVAILABLE",
            "Wedding website is temporarily unavailable. Please try again.",
          )
        : e,
      requestId,
    );
  }
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  logRequest({
    requestId,
    route: preview
      ? "/api/v1/weddings/:weddingId/website/preview"
      : "/api/v1/public/weddings/:slug",
    method: request.method,
    status: response.status,
    durationMs: performance.now() - startedAt,
  });
  return response;
}
