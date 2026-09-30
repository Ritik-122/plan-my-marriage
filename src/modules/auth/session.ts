import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { getAppConfig, getSessionConfig } from "@/lib/config/env.server";

export const SESSION_COOKIE = "pmm_session";
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
const issuer = "plan-my-marriage";
const audience = "pmm-app";
const payloadSchema = z.object({
  sub: z.string().regex(/^[a-f\d]{24}$/i),
  sessionVersion: z.number().int().positive(),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
});
function key() {
  return new TextEncoder().encode(getSessionConfig().SESSION_SECRET);
}
export function createSession(userId: string, sessionVersion: number) {
  return new SignJWT({ sessionVersion })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .setIssuer(issuer)
    .setAudience(audience)
    .sign(key());
}
export async function readSession(token?: string) {
  if (!token || token.length > 4096) return null;
  const secret = key();
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer,
      audience,
      maxTokenAge: `${SESSION_SECONDS}s`,
    });
    const parsed = payloadSchema.safeParse(payload);
    if (
      !parsed.success ||
      parsed.data.iat > Math.floor(Date.now() / 1000) ||
      parsed.data.exp - parsed.data.iat > SESSION_SECONDS
    )
      return null;
    return parsed.data;
  } catch {
    return null;
  }
}
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    // HTTPS deployments always use Secure; local HTTP can exercise production builds.
    secure: new URL(getAppConfig().APP_BASE_URL).protocol === "https:",
    maxAge: SESSION_SECONDS,
  };
}
