import { createRequestContext } from "@/lib/http/request-context";
import { successResponse } from "@/lib/http/responses";
import { logRequest } from "@/lib/logging/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const { requestId, startedAt } = createRequestContext();
  const response = successResponse({ status: "ok" }, requestId);
  logRequest({
    requestId,
    route: "/api/v1/health",
    method: "GET",
    status: 200,
    durationMs: performance.now() - startedAt,
  });
  return response;
}
