import "server-only";
import type { NextRequest } from "next/server";
import { authenticate } from "@/modules/auth/service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import {
  limitInvitationRead,
  limitTeamRequests,
} from "@/modules/auth/rate-limit";
import { assertSameOrigin, readInput } from "@/lib/http/input";
import { HttpError } from "@/lib/http/errors";
import { ConfigurationError } from "@/lib/config/env.server";
import { createRequestContext } from "@/lib/http/request-context";
import { successResponse, errorResponse } from "@/lib/http/responses";
import { logRequest } from "@/lib/logging/logger";
import { inviteSchema, acceptSchema } from "./schema";
import * as service from "./service";
type Target = {
  kind: "members" | "invitations" | "context" | "accept";
  weddingId?: string;
  id?: string;
  resend?: boolean;
};
export async function handleTeam(request: NextRequest, target: Target) {
  const { requestId, startedAt } = createRequestContext();
  let response: Response;
  try {
    if (request.method !== "GET") assertSameOrigin(request);
    const user = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
    if (target.kind === "context") {
      await limitInvitationRead(request);
      response = successResponse(
        await service.invitationContext(
          request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "",
          user,
        ),
        requestId,
      );
    } else {
      if (!user)
        throw new HttpError(
          401,
          "AUTH_REQUIRED",
          "Please sign in to continue.",
        );
      if (request.method !== "GET")
        await limitTeamRequests(
          user.id,
          target.kind === "invitations" && request.method === "POST",
        );
      const weddingId = target.weddingId ?? "";
      if (target.kind === "accept") {
        const input = await readInput(request, acceptSchema, {
          fields: ["token"],
          maxBytes: 1024,
        });
        response = successResponse(
          await service.accept(input.token, user),
          requestId,
        );
      } else if (request.method === "DELETE" && target.id) {
        if (target.kind === "members")
          await service.removeMember(user.id, weddingId, target.id);
        else await service.revoke(user.id, weddingId, target.id);
        response = new Response(null, {
          status: 204,
          headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
        });
      } else if (request.method === "POST") {
        const input = target.resend
          ? { email: "", role: "MANAGER" as const }
          : await readInput(request, inviteSchema, {
              fields: ["email", "role"],
              maxBytes: 2048,
            });
        response = successResponse(
          await service.invite(
            user.id,
            weddingId,
            input,
            target.resend ? target.id : undefined,
          ),
          requestId,
          { status: 201 },
        );
      } else
        response = successResponse(
          target.kind === "members"
            ? await service.listMembers(user.id, weddingId)
            : await service.listInvitations(user.id, weddingId),
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
            "Team service is temporarily unavailable. Please try again later.",
          )
        : error,
      requestId,
    );
    if (response.status === 429) response.headers.set("Retry-After", "900");
  }
  logRequest({
    requestId,
    route: `/api/v1/team/${target.kind}`,
    method: request.method,
    status: response.status,
    durationMs: performance.now() - startedAt,
  });
  return response;
}
