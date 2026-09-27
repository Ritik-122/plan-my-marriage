import { HttpError } from "./errors";

function headers(requestId: string) {
  return { "X-Request-Id": requestId, "Cache-Control": "no-store" };
}

export function successResponse<T>(
  data: T,
  requestId: string,
  options: { status?: number; nextCursor?: string | null } = {},
) {
  return Response.json(
    {
      data,
      meta: {
        requestId,
        ...(options.nextCursor !== undefined
          ? { nextCursor: options.nextCursor }
          : {}),
      },
    },
    { status: options.status ?? 200, headers: headers(requestId) },
  );
}

export function errorResponse(error: unknown, requestId: string) {
  const known = error instanceof HttpError;
  return Response.json(
    {
      error: {
        code: known ? error.code : "INTERNAL_ERROR",
        message: known
          ? error.message
          : "Something went wrong. Please try again.",
        ...(known && error.fields ? { fields: error.fields } : {}),
      },
      meta: { requestId },
    },
    { status: known ? error.status : 500, headers: headers(requestId) },
  );
}
