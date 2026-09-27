import "server-only";
import pino, { type DestinationStream } from "pino";
import { getAppConfig } from "@/lib/config/env.server";

const sensitiveKeys = [
  "password",
  "passwordHash",
  "token",
  "tokenHash",
  "rawToken",
  "accessToken",
  "refreshToken",
  "sessionToken",
  "guestAccessToken",
  "photoUploadToken",
  "authorization",
  "Authorization",
  "cookie",
  "Cookie",
  "secret",
  "apiKey",
  "uploadUrl",
  "presignedUrl",
  "MONGODB_URI",
  "SESSION_SECRET",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "RESEND_API_KEY",
  "VENDOR_PROVIDER_KEY",
];

export function createLogger(destination?: DestinationStream) {
  const options: pino.LoggerOptions = {
    level: getAppConfig().LOG_LEVEL,
    base: undefined,
    redact: {
      paths: [
        ...sensitiveKeys.flatMap((key) => [key, `*.${key}`]),
        "req.headers.authorization",
        "req.headers.cookie",
        'res.headers["set-cookie"]',
      ],
      censor: "[REDACTED]",
    },
  };
  return destination ? pino(options, destination) : pino(options);
}

let logger: ReturnType<typeof createLogger> | undefined;

type RequestLog = {
  requestId: string;
  route: string; // A static route template; never request.url or a token path.
  method: string;
  status: number;
  durationMs: number;
};

export function logRequest({
  requestId,
  route,
  method,
  status,
  durationMs,
}: RequestLog) {
  logger ??= createLogger();
  // Explicit allowlist: no request bodies, headers, URLs, or raw errors.
  logger.info(
    { requestId, route, method, status, durationMs },
    "request_completed",
  );
}
