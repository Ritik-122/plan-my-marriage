import "server-only";
import type { NextRequest } from "next/server";
import { authenticate } from "@/modules/auth/service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import { limitExpenseRequests } from "@/modules/auth/rate-limit";
import { assertSameOrigin, readInput } from "@/lib/http/input";
import { HttpError } from "@/lib/http/errors";
import { ConfigurationError } from "@/lib/config/env.server";
import { createRequestContext } from "@/lib/http/request-context";
import { successResponse, errorResponse } from "@/lib/http/responses";
import { logRequest } from "@/lib/logging/logger";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseFiltersSchema,
} from "./schema";
import {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  expenseSummary,
} from "./service";
export async function handleExpense(
  request: NextRequest,
  weddingId: string,
  expenseId?: string,
  context = false,
) {
  const { requestId, startedAt } = createRequestContext();
  let response: Response;
  try {
    if (request.method !== "GET") assertSameOrigin(request);
    const user = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user)
      throw new HttpError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    if (request.method !== "GET") await limitExpenseRequests(user.id);
    const options = {
      fields: [
        "name",
        "category",
        "amount",
        "date",
        "eventId",
        "vendorName",
        "paidBy",
        "notes",
      ],
      maxBytes: 16384,
    };
    if (context)
      response = successResponse(
        await expenseSummary(user.id, weddingId),
        requestId,
      );
    else if (request.method === "POST")
      response = successResponse(
        await createExpense(
          user.id,
          weddingId,
          await readInput(request, createExpenseSchema, options),
        ),
        requestId,
        { status: 201 },
      );
    else if (request.method === "PATCH" && expenseId)
      response = successResponse(
        await updateExpense(
          user.id,
          weddingId,
          expenseId,
          await readInput(request, updateExpenseSchema, options),
        ),
        requestId,
      );
    else if (request.method === "DELETE" && expenseId) {
      await deleteExpense(user.id, weddingId, expenseId);
      response = new Response(null, {
        status: 204,
        headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
      });
    } else if (expenseId)
      response = successResponse(
        await getExpense(user.id, weddingId, expenseId),
        requestId,
      );
    else {
      const parsed = expenseFiltersSchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      if (!parsed.success)
        throw new HttpError(
          400,
          "VALIDATION_ERROR",
          "Check the expense filters and date range.",
        );
      const result = await listExpenses(user.id, weddingId, parsed.data);
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
            "Expense service is temporarily unavailable. Please try again later.",
          )
        : error,
      requestId,
    );
    if (response.status === 429) response.headers.set("Retry-After", "900");
  }
  logRequest({
    requestId,
    route: expenseId
      ? "/api/v1/weddings/:weddingId/expenses/:expenseId"
      : "/api/v1/weddings/:weddingId/expenses",
    method: request.method,
    status: response.status,
    durationMs: performance.now() - startedAt,
  });
  return response;
}
