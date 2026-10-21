import "server-only";
import type { NextRequest } from "next/server";
import { authenticate } from "@/modules/auth/service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import { limitTaskRequests } from "@/modules/auth/rate-limit";
import { assertSameOrigin, readInput } from "@/lib/http/input";
import { HttpError } from "@/lib/http/errors";
import { ConfigurationError } from "@/lib/config/env.server";
import { createRequestContext } from "@/lib/http/request-context";
import { successResponse, errorResponse } from "@/lib/http/responses";
import { logRequest } from "@/lib/logging/logger";
import {
  createTaskSchema,
  updateTaskSchema,
  taskFiltersSchema,
} from "./schema";
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  taskContext,
} from "./service";
export async function handleTask(
  request: NextRequest,
  weddingId: string,
  taskId?: string,
  context = false,
) {
  const { requestId, startedAt } = createRequestContext();
  let response: Response;
  try {
    if (request.method !== "GET") assertSameOrigin(request);
    const user = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user)
      throw new HttpError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    if (request.method !== "GET") await limitTaskRequests(user.id);
    const options = {
      fields: [
        "title",
        "description",
        "eventId",
        "assignedToUserId",
        "dueDate",
        "status",
        "priority",
      ],
      maxBytes: 16384,
    };
    if (context)
      response = successResponse(
        await taskContext(user.id, weddingId),
        requestId,
      );
    else if (request.method === "POST")
      response = successResponse(
        await createTask(
          user.id,
          weddingId,
          await readInput(request, createTaskSchema, options),
        ),
        requestId,
        { status: 201 },
      );
    else if (request.method === "PATCH" && taskId)
      response = successResponse(
        await updateTask(
          user.id,
          weddingId,
          taskId,
          await readInput(request, updateTaskSchema, options),
        ),
        requestId,
      );
    else if (request.method === "DELETE" && taskId) {
      await deleteTask(user.id, weddingId, taskId);
      response = new Response(null, {
        status: 204,
        headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
      });
    } else if (taskId)
      response = successResponse(
        await getTask(user.id, weddingId, taskId),
        requestId,
      );
    else {
      const parsed = taskFiltersSchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      if (!parsed.success)
        throw new HttpError(
          400,
          "VALIDATION_ERROR",
          "Check the task filters and date range.",
        );
      const result = await listTasks(user.id, weddingId, parsed.data);
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
            "Task service is temporarily unavailable. Please try again later.",
          )
        : error,
      requestId,
    );
    if (response.status === 429) response.headers.set("Retry-After", "900");
  }
  logRequest({
    requestId,
    route: taskId
      ? "/api/v1/weddings/:weddingId/tasks/:taskId"
      : "/api/v1/weddings/:weddingId/tasks",
    method: request.method,
    status: response.status,
    durationMs: performance.now() - startedAt,
  });
  return response;
}
