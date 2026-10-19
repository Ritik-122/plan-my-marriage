import "server-only";
import { z } from "zod";

type Environment = Record<string, string | undefined>;

const appSchema = z.object({
  APP_BASE_URL: z
    .url()
    .refine((value) => ["http:", "https:"].includes(new URL(value).protocol))
    .default("http://localhost:3000"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

const mongoSchema = z.object({
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\/\S+$/),
  MONGODB_DB_NAME: z.string().min(1).default("plan_my_marriage"),
});

export class ConfigurationError extends Error {
  constructor(capability: string, fields: string[]) {
    // Report names only: validation errors must not disclose credential values.
    super(`Invalid ${capability} configuration: ${fields.join(", ")}`);
    this.name = "ConfigurationError";
  }
}

function parseConfig<T>(
  schema: z.ZodType<T>,
  environment: Environment,
  capability: string,
): T {
  const result = schema.safeParse(environment);
  if (!result.success) {
    throw new ConfigurationError(capability, [
      ...new Set(result.error.issues.map((issue) => String(issue.path[0]))),
    ]);
  }
  return result.data;
}

export function getAppConfig(environment: Environment = process.env) {
  return parseConfig(appSchema, environment, "application");
}

// Called only when a database capability is actually used, never at import time.
export function getMongoConfig(environment: Environment = process.env) {
  return parseConfig(mongoSchema, environment, "MongoDB");
}

export function getEmailConfig(environment: Environment = process.env) {
  return parseConfig(
    z.object({
      RESEND_API_KEY: z.string().min(1),
      EMAIL_FROM: z
        .string()
        .min(3)
        .max(320)
        .refine(
          (value) =>
            !/[\r\n]/.test(value) &&
            z.email().safeParse(value.match(/<([^<>]+)>$/)?.[1] ?? value)
              .success,
        ),
      EMAIL_REPLY_TO: z.preprocess(
        (value) => (value === "" ? undefined : value),
        z.email().optional(),
      ),
    }),
    environment,
    "email",
  );
}

export function getSessionConfig(environment: Environment = process.env) {
  const config = parseConfig(
    z.object({ SESSION_SECRET: z.string().min(32).max(1024) }),
    environment,
    "session",
  );
  const base = new URL(getAppConfig(environment).APP_BASE_URL);
  const local =
    ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname) &&
    environment.VERCEL !== "1";
  if (
    environment.NODE_ENV === "production" &&
    base.protocol !== "https:" &&
    !local
  ) {
    throw new ConfigurationError("session", ["APP_BASE_URL (HTTPS required)"]);
  }
  return config;
}
