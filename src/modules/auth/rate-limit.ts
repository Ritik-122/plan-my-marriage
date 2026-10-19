import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import mongoose, { Schema } from "mongoose";
import { getSessionConfig } from "@/lib/config/env.server";
import { connectMongo } from "@/lib/db/mongoose";
import { HttpError } from "@/lib/http/errors";

const schema = new Schema(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
  },
  { collection: "rateLimitBuckets", bufferCommands: false },
);
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RateLimitBucket =
  mongoose.models.RateLimitBucket ?? mongoose.model("RateLimitBucket", schema);
const windowMs = 15 * 60 * 1000;

export function clientIdentity(request: Request) {
  // Only Vercel's controlled ingress may supply the client IP. Untrusted
  // forwarding headers must not allow callers to evade the limiter locally.
  if (process.env.VERCEL === "1") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
    if (ip && isIP(ip)) return ip.toLowerCase();
  }
  return "shared-local-or-untrusted-ingress";
}
async function increment(identity: string, policy: string, limit: number) {
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const _id = createHmac("sha256", getSessionConfig().SESSION_SECRET)
    .update(JSON.stringify([policy, identity, windowStart]))
    .digest("hex");
  const update = {
    $inc: { count: 1 },
    $setOnInsert: { expiresAt: new Date(windowStart + windowMs) },
  };
  let bucket;
  try {
    bucket = await RateLimitBucket.findOneAndUpdate({ _id }, update, {
      upsert: true,
      returnDocument: "after",
    }).lean();
  } catch (error) {
    if (!(
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ))
      throw error;
    // Concurrent first requests can race to insert the same unique _id.
    bucket = await RateLimitBucket.findOneAndUpdate(
      { _id },
      { $inc: { count: 1 } },
      { returnDocument: "after" },
    ).lean();
  }
  if (!bucket || Number(bucket.count) > limit) {
    throw new HttpError(
      429,
      "RATE_LIMITED",
      "Too many attempts. Please try again in 15 minutes.",
    );
  }
}
export async function limitAccountRequests(
  request: Request,
  action: "register" | "login",
  email?: string,
) {
  await connectMongo();
  const identity = clientIdentity(request);
  if (!email)
    await increment(identity, `${action}:ip`, action === "register" ? 10 : 30);
  if (email) await increment(`${identity}:${email}`, `${action}:account`, 8);
}

export async function limitWeddingRequests(
  userId: string,
  action: "create" | "update",
) {
  await connectMongo();
  await increment(userId, `weddings:${action}`, action === "create" ? 10 : 60);
}

export async function limitEventRequests(userId: string) {
  await connectMongo();
  await increment(userId, "events:mutate", 60);
}

export async function limitGuestRequests(userId: string) {
  await connectMongo();
  await increment(userId, "guests:mutate", 120);
}

export async function limitInvitationRead(request: Request) {
  await connectMongo();
  await increment(clientIdentity(request), "invitations:read", 300);
}
export async function limitRsvpRequests(request: Request, tokenHash: string) {
  await connectMongo();
  await increment(clientIdentity(request), "rsvp:ip", 300);
  await increment(tokenHash, "rsvp:token", 60);
}
export async function limitInvitationCreation(userId: string) {
  await connectMongo();
  await increment(userId, "invitations:create", 60);
}

export async function limitGuestEmailRequests(userId: string) {
  await connectMongo();
  await increment(userId, "guest-email:send", 20);
}

export async function limitTeamRequests(userId: string, sending: boolean) {
  await connectMongo();
  await increment(
    userId,
    sending ? "team:send" : "team:mutate",
    sending ? 20 : 60,
  );
}
