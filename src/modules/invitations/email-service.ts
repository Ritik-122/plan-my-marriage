import "server-only";
import { getGuest } from "@/modules/guests/service";
import { getAppConfig, getEmailConfig } from "@/lib/config/env.server";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { HttpError } from "@/lib/http/errors";
import { createToken } from "./token";
import { renderGuestEmail } from "./email-template";
import * as repository from "./email-repository";
import type { GuestEmailInput } from "./email-schema";
export async function guestEmailState(
  userId: string,
  weddingId: string,
  guestId: string,
) {
  await getGuest(userId, weddingId, guestId);
  const [preview, attempts] = await Promise.all([
    repository.emailPreview(weddingId, guestId),
    repository.attempts(weddingId, guestId),
  ]);
  const base = new URL(getAppConfig().APP_BASE_URL);
  return {
    preview,
    attempts,
    localOnly: ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname),
  };
}
export async function emailGuest(
  userId: string,
  weddingId: string,
  guestId: string,
  input: GuestEmailInput,
) {
  await getGuest(userId, weddingId, guestId);
  getEmailConfig();
  const { token, tokenHash } = createToken();
  const result = await repository.beginEmail(
    userId,
    weddingId,
    guestId,
    input,
    tokenHash,
  );
  if (result.duplicate)
    return {
      sent: true,
      email: result.attempt.recipient,
      attempt: result.attempt,
    };
  const url = new URL(
    `/guest/invite/${token}`,
    getAppConfig().APP_BASE_URL,
  ).toString();
  const body = renderGuestEmail(result.preview, url);
  let providerId: string;
  try {
    providerId = await sendTransactionalEmail({
      email: result.preview.recipient,
      subject: result.preview.subject,
      ...body,
      idempotencyKey: `guest-invitation/${result.id}`,
    });
  } catch (error) {
    await repository.failedEmail(weddingId, guestId, result.id);
    throw error;
  }
  const attempt = await repository.completeEmail(
    weddingId,
    guestId,
    result.id,
    result.preview.recipient,
    providerId,
  );
  if (!attempt)
    throw new HttpError(
      409,
      "CONFLICT",
      "The guest or invitation link changed while sending. The emailed link is no longer active. Review the guest before resending.",
    );
  return { sent: true, email: attempt.recipient, attempt };
}
