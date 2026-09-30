import "server-only";
import { NextRequest, NextResponse } from "next/server";
import {
  ConfigurationError,
  getMongoConfig,
  getSessionConfig,
} from "@/lib/config/env.server";
import { HttpError } from "@/lib/http/errors";
import { createRequestContext } from "@/lib/http/request-context";
import { errorResponse, successResponse } from "@/lib/http/responses";
import { logRequest } from "@/lib/logging/logger";
import { loginSchema, registerSchema } from "./schema";
import { authenticate, login, register } from "./service";
import { limitAccountRequests } from "./rate-limit";
import { SESSION_COOKIE, sessionCookieOptions } from "./session";

export { assertSameOrigin, readInput } from "@/lib/http/input";
import { assertSameOrigin, readInput } from "@/lib/http/input";

type Action = "register" | "login" | "logout" | "me";
export async function handleAuth(request: NextRequest, action: Action) {
  const { requestId, startedAt } = createRequestContext();
  let response: Response;
  try {
    if (action !== "me") assertSameOrigin(request);
    if (action === "logout") {
      const result = new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
      });
      result.cookies.set(SESSION_COOKIE, "", {
        ...sessionCookieOptions(),
        maxAge: 0,
        expires: new Date(0),
      });
      response = result;
    } else if (action === "me") {
      const user = await authenticate(
        request.cookies.get(SESSION_COOKIE)?.value,
      );
      if (!user)
        throw new HttpError(
          401,
          "AUTH_REQUIRED",
          "Please sign in to continue.",
        );
      response = successResponse({ user }, requestId);
    } else {
      getSessionConfig();
      getMongoConfig();
      // Limit before parsing or hashing; malformed attempts also consume a slot.
      await limitAccountRequests(request, action);
      const result =
        action === "register"
          ? await register(await readInput(request, registerSchema))
          : await (async () => {
              const input = await readInput(request, loginSchema);
              await limitAccountRequests(request, "login", input.email);
              return login(input);
            })();
      const base = successResponse({ user: result.user }, requestId, {
        status: action === "register" ? 201 : 200,
      });
      const withCookie = new NextResponse(base.body, {
        status: base.status,
        headers: base.headers,
      });
      withCookie.cookies.set(
        SESSION_COOKIE,
        result.token,
        sessionCookieOptions(),
      );
      response = withCookie;
    }
  } catch (error) {
    const unavailable =
      error instanceof ConfigurationError ||
      (error instanceof Error && /^(Mongo|Mongoose)/.test(error.name));
    response = errorResponse(
      unavailable
        ? new HttpError(
            503,
            "PROVIDER_UNAVAILABLE",
            "Account service is temporarily unavailable. Please try again later.",
          )
        : error,
      requestId,
    );
    if (response.status === 429) response.headers.set("Retry-After", "900");
  }
  logRequest({
    requestId,
    route: `/api/v1/auth/${action}`,
    method: request.method,
    status: response.status,
    durationMs: performance.now() - startedAt,
  });
  return response;
}
