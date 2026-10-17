import "server-only";
import { getGuest } from "@/modules/guests/service";
import { getAppConfig } from "@/lib/config/env.server";
import { connectMongo } from "@/lib/db/mongoose";
import { HttpError } from "@/lib/http/errors";
import { createToken, hashToken, tokenPattern } from "./token";
import * as repository from "./repository";
import type { RsvpInput } from "./schema";
export async function submitRsvps(token: string, input: RsvpInput) {
  if (!tokenPattern.test(token)) throw repository.invalidLink();
  await connectMongo();
  return repository.saveResponses(hashToken(token), input);
}
export async function createLink(
  userId: string,
  weddingId: string,
  guestId: string,
  expiresAt: string,
) {
  await getGuest(userId, weddingId, guestId);
  const { token, tokenHash } = createToken();
  const base = new URL(getAppConfig().APP_BASE_URL);
  const accessTokenId = await repository.createRecord(
    weddingId,
    guestId,
    userId,
    tokenHash,
    new Date(expiresAt),
  );
  return {
    accessTokenId,
    url: new URL(`/guest/invite/${token}`, base).toString(),
    expiresAt: new Date(expiresAt).toISOString(),
  };
}
export async function listLinks(
  userId: string,
  weddingId: string,
  guestId: string,
) {
  await getGuest(userId, weddingId, guestId);
  return repository.listRecords(weddingId, guestId);
}
export async function revokeLink(
  userId: string,
  weddingId: string,
  guestId: string,
  id: string,
) {
  await getGuest(userId, weddingId, guestId);
  if (!/^[a-f\d]{24}$/i.test(id))
    throw new HttpError(404, "NOT_FOUND", "Invitation link not found.");
  await repository.revokeRecord(weddingId, guestId, id);
}
export async function previewInvitation(
  userId: string,
  weddingId: string,
  guestId: string,
) {
  await getGuest(userId, weddingId, guestId);
  return repository.contextForGuest(weddingId, guestId);
}
export async function readInvitation(token: string) {
  if (!tokenPattern.test(token)) throw repository.invalidLink();
  await connectMongo();
  return repository.readByHash(hashToken(token));
}
