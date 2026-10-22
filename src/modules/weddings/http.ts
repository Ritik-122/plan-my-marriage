import "server-only";
import type { NextRequest } from "next/server";
import { authenticate } from "@/modules/auth/service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import { limitWeddingRequests } from "@/modules/auth/rate-limit";
import { assertSameOrigin, readInput } from "@/lib/http/input";
import { HttpError } from "@/lib/http/errors";
import { ConfigurationError } from "@/lib/config/env.server";
import { createRequestContext } from "@/lib/http/request-context";
import { successResponse, errorResponse } from "@/lib/http/responses";
import { logRequest } from "@/lib/logging/logger";
import { createWeddingSchema, updateWeddingSchema } from "./schema";
import {
  createWedding,
  getWedding,
  listWeddings,
  updateWedding,
} from "./service";

export async function handleWedding(request: NextRequest, weddingId?: string) {
  const { requestId, startedAt } = createRequestContext();
  let response: Response;
  try {
    if (request.method !== "GET") assertSameOrigin(request);
    const user = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user)
      throw new HttpError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    const options = {
      fields: [
        "brideName",
        "groomName",
        "weddingDate",
        "city",
        "slug",
        "theme",
        "description",
        "website",
      ],
      maxBytes: 8192,
    };
    if (request.method === "POST") {
      await limitWeddingRequests(user.id, "create");
      response = successResponse(
        await createWedding(
          user.id,
          await readInput(request, createWeddingSchema, options),
        ),
        requestId,
        { status: 201 },
      );
    } else if (request.method === "PATCH" && weddingId) {
      await limitWeddingRequests(user.id, "update");
      response = successResponse(
        await updateWedding(
          user.id,
          weddingId,
          await readInput(request, updateWeddingSchema, options),
        ),
        requestId,
      );
    } else
      response = successResponse(
        weddingId
          ? await getWedding(user.id, weddingId)
          : await listWeddings(user.id),
        requestId,
      );
  } catch (error) {
    const unavailable =
      error instanceof ConfigurationError ||
      (error instanceof Error && /^(Mongo|Mongoose)/.test(error.name));
    response = errorResponse(
      unavailable
        ? new HttpError(
            503,
            "PROVIDER_UNAVAILABLE",
            "Wedding setup is temporarily unavailable. Please try again later.",
          )
        : error,
      requestId,
    );
    if (response.status === 429) response.headers.set("Retry-After", "900");
  }
  logRequest({
    requestId,
    route: weddingId ? "/api/v1/weddings/:weddingId" : "/api/v1/weddings",
    method: request.method,
    status: response.status,
    durationMs: performance.now() - startedAt,
  });
  return response;
}
