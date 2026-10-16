import { createHash, randomBytes } from "node:crypto";
export const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function createToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}
