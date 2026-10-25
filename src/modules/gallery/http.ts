import "server-only";
import type { NextRequest } from "next/server";
import { authenticate } from "@/modules/auth/service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import { limitGalleryRequests } from "@/modules/auth/rate-limit";
import { assertSameOrigin, readInput } from "@/lib/http/input";
import { HttpError } from "@/lib/http/errors";
import { ConfigurationError } from "@/lib/config/env.server";
import { createRequestContext } from "@/lib/http/request-context";
import { successResponse, errorResponse } from "@/lib/http/responses";
import { logRequest } from "@/lib/logging/logger";
import { presignSchema, finalizeSchema, photoFiltersSchema } from "./schema";
import {
  presign,
  finalize,
  listPhotos,
  getPhoto,
  deletePhoto,
  photoSummary,
} from "./service";
export async function handleGallery(
  request: NextRequest,
  weddingId: string,
  action: "photos" | "presign" | "finalize" | "summary",
  photoId?: string,
) {
  const { requestId, startedAt } = createRequestContext();
  let response: Response;
  try {
    if (request.method !== "GET") assertSameOrigin(request);
    const user = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user)
      throw new HttpError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    if (request.method !== "GET")
      await limitGalleryRequests(user.id, action === "presign");
    const options = {
      fields: [
        "purpose",
        "eventId",
        "fileName",
        "mimeType",
        "sizeBytes",
        "objectKey",
        "originalFileName",
      ],
      maxBytes: 4096,
    };
    if (action === "presign")
      response = successResponse(
        await presign(
          user.id,
          weddingId,
          await readInput(request, presignSchema, options),
        ),
        requestId,
      );
    else if (action === "finalize")
      response = successResponse(
        await finalize(
          user.id,
          weddingId,
          await readInput(request, finalizeSchema, options),
        ),
        requestId,
        { status: 201 },
      );
    else if (action === "summary")
      response = successResponse(
        await photoSummary(user.id, weddingId),
        requestId,
      );
    else if (photoId && request.method === "DELETE") {
      await deletePhoto(user.id, weddingId, photoId);
      response = new Response(null, {
        status: 204,
        headers: { "X-Request-Id": requestId, "Cache-Control": "no-store" },
      });
    } else if (photoId)
      response = successResponse(
        await getPhoto(user.id, weddingId, photoId),
        requestId,
      );
    else {
      const filters = photoFiltersSchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      if (!filters.success)
        throw new HttpError(
          400,
          "VALIDATION_ERROR",
          "Check your photo filters.",
        );
      const result = await listPhotos(user.id, weddingId, filters.data);
      response = successResponse(result.data, requestId, {
        nextCursor: result.nextCursor,
      });
    }
  } catch (e) {
    response = errorResponse(
      e instanceof ConfigurationError ||
        (e instanceof Error && /^(Mongo|Mongoose)/.test(e.name))
        ? new HttpError(
            503,
            "PROVIDER_UNAVAILABLE",
            "Photo storage is not ready. Please check its configuration or try again later.",
          )
        : e,
      requestId,
    );
    if (response.status === 429) response.headers.set("Retry-After", "900");
  }
  logRequest({
    requestId,
    route:
      action === "presign" || action === "finalize"
        ? `/api/v1/weddings/:weddingId/uploads/${action}`
        : photoId
          ? "/api/v1/weddings/:weddingId/photos/:photoId"
          : `/api/v1/weddings/:weddingId/photos${action === "summary" ? "/summary" : ""}`,
    method: request.method,
    status: response.status,
    durationMs: performance.now() - startedAt,
  });
  return response;
}
