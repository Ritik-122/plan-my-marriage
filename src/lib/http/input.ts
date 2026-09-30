import "server-only";
import { z } from "zod";
import { getAppConfig } from "@/lib/config/env.server";
import { HttpError } from "./errors";
export function assertSameOrigin(request: Request) {
  const expected = new URL(getAppConfig().APP_BASE_URL).origin;
  const origin = request.headers.get("origin");
  let actual = origin;
  if (!origin) {
    try {
      actual = new URL(request.headers.get("referer") ?? "").origin;
    } catch {
      actual = null;
    }
  }
  if (
    actual !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new HttpError(403, "FORBIDDEN", "This request is not allowed.");
  }
}
export async function readInput<T>(
  request: Request,
  schema: z.ZodType<T>,
  options: { fields?: string[]; maxBytes?: number } = {},
): Promise<T> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    throw new HttpError(400, "VALIDATION_ERROR", "Send a JSON request.");
  }
  const reader = request.body?.getReader();
  if (!reader)
    throw new HttpError(400, "VALIDATION_ERROR", "Enter your details.");
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > (options.maxBytes ?? 4096)) {
      await reader.cancel();
      throw new HttpError(400, "VALIDATION_ERROR", "Request is too large.");
    }
    chunks.push(value);
  }
  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "VALIDATION_ERROR", "Send valid JSON.");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (
        typeof field === "string" &&
        (options.fields ?? ["email", "password", "displayName"]).includes(field)
      )
        fields[field] ??= issue.message;
    }
    throw new HttpError(400, "VALIDATION_ERROR", "Check your details.", fields);
  }
  return result.data;
}
