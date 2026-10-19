import "server-only";
import { getEmailConfig } from "@/lib/config/env.server";
import { HttpError } from "@/lib/http/errors";
const unconfirmed =
  "Email sending could not be confirmed. Use Resend invitation to try again.";
async function rejection(response: Response) {
  // Classify internally, then return only our own text. Never expose provider
  // messages: they can contain account addresses or other private information.
  const body: unknown = await response.json().catch(() => null);
  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const name = typeof record.name === "string" ? record.name : "";
  const detail = typeof record.message === "string" ? record.message : "";
  let message = unconfirmed;
  if (
    response.status === 403 &&
    /only send testing emails to your own email address/i.test(detail)
  ) {
    message =
      "Resend's test sender can only invite the email address registered with your Resend account. To invite other people, verify your own sending domain in Resend and update EMAIL_FROM.";
  } else if (
    response.status === 403 &&
    /domain is not verified/i.test(detail)
  ) {
    message =
      "Resend has not verified the sending domain. Verify the domain used by EMAIL_FROM, or use onboarding@resend.dev for testing with your Resend account email.";
  } else if (
    ["restricted_api_key", "suspended_api_key", "invalid_permission"].includes(
      name,
    )
  ) {
    message =
      "Resend rejected this key's sending permissions. Check that the key is active and allowed to send from the configured domain.";
  } else if (response.status === 401 || /API key is invalid/i.test(detail)) {
    message =
      "Resend rejected the email API key. Check RESEND_API_KEY and restart the server after updating it.";
  } else if (
    ["daily_quota_exceeded", "monthly_quota_exceeded"].includes(name)
  ) {
    message =
      "The Resend sending quota has been reached. Check your account's sending allowance before retrying.";
  } else if (response.status === 429) {
    message =
      "Resend is temporarily rate limiting email requests. Wait a moment, then use Resend invitation.";
  } else if (response.status === 403) {
    message =
      "Resend refused this email. Check the failed request in Resend Logs for sender, recipient, or account restrictions.";
  } else if ([400, 422].includes(response.status)) {
    message =
      "Resend rejected the email settings. Check EMAIL_FROM, EMAIL_REPLY_TO, and the recipient address.";
  }
  return new HttpError(502, "EMAIL_DELIVERY_FAILED", message);
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}
export async function sendTeamEmail(input: {
  email: string;
  couple: string;
  role: string;
  url: string;
  id: string;
}) {
  const text = `You are invited to plan ${input.couple}'s wedding as ${input.role === "ADMIN" ? "an Admin with full team-management access" : "a Manager with planning access"}.\n\nAccept your invitation: ${input.url}\n\nSign in or create an account using this email address. This link expires in 7 days. If you did not expect this invitation, you can ignore it.`;
  return sendTransactionalEmail({
    email: input.email,
    subject: "Your wedding planning invitation",
    text,
    html: `<h1>Plan something beautiful together</h1><p>${escapeHtml(text).replace(/\n/g, "<br>")}</p><p><a href="${escapeHtml(input.url)}">Accept invitation</a></p>`,
    idempotencyKey: `team-invitation/${input.id}`,
  });
}
export async function sendTransactionalEmail(input: {
  email: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
}) {
  const config = getEmailConfig();
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${config.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        from: config.EMAIL_FROM,
        to: [input.email],
        subject: input.subject,
        text: input.text,
        html: input.html,
        ...(config.EMAIL_REPLY_TO ? { reply_to: config.EMAIL_REPLY_TO } : {}),
      }),
    });
    if (!response.ok) throw await rejection(response);
    const result: unknown = await response.json();
    if (
      !result ||
      typeof result !== "object" ||
      !("id" in result) ||
      typeof result.id !== "string" ||
      !result.id
    )
      throw new Error("Invalid response");
    return result.id;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, "EMAIL_DELIVERY_FAILED", unconfirmed);
  }
}
