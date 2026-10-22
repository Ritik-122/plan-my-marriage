import "server-only";
import type { NextRequest } from "next/server";
import { authenticate } from "@/modules/auth/service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import { ConfigurationError } from "@/lib/config/env.server";
import { HttpError } from "@/lib/http/errors";
import { createRequestContext } from "@/lib/http/request-context";
import { successResponse, errorResponse } from "@/lib/http/responses";
import { logRequest } from "@/lib/logging/logger";
import { dashboard } from "./service";
export async function handleDashboard(request: NextRequest, weddingId: string) {
  const { requestId, startedAt } = createRequestContext();
  let response: Response;
  try {
    const user = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user)
      throw new HttpError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    response = successResponse(await dashboard(user.id, weddingId), requestId);
  } catch (e) {
    response = errorResponse(
      e instanceof ConfigurationError ||
        (e instanceof Error && /^(Mongo|Mongoose)/.test(e.name))
        ? new HttpError(
            503,
            "PROVIDER_UNAVAILABLE",
            "Dashboard is temporarily unavailable. Please try again.",
          )
        : e,
      requestId,
    );
  }
  logRequest({
    requestId,
    route: "/api/v1/weddings/:weddingId/dashboard",
    method: request.method,
    status: response.status,
    durationMs: performance.now() - startedAt,
  });
  return response;
}
