import "server-only";
import { randomUUID } from "node:crypto";

export function createRequestContext() {
  // Generate locally instead of trusting a caller-controlled correlation header.
  return { requestId: `req_${randomUUID()}`, startedAt: performance.now() };
}
