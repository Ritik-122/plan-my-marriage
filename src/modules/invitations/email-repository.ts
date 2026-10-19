import "server-only";
import mongoose, { type ClientSession } from "mongoose";
import { createHash } from "node:crypto";
import { z } from "zod";
import { Guest, EventGuest } from "@/modules/guests/models";
import { Wedding, WeddingMember } from "@/modules/weddings/models";
import { WeddingEvent } from "@/modules/events/model";
import { HttpError } from "@/lib/http/errors";
import { GuestAccessToken, type AccessRecord } from "./model";
import type { GuestEmailAttempt, GuestEmailPreview } from "./email-dto";
import type { GuestEmailInput } from "./email-schema";
const missing = () => new HttpError(404, "NOT_FOUND", "Guest not found.");
export async function emailPreview(
  weddingId: string,
  guestId: string,
  session?: ClientSession,
): Promise<GuestEmailPreview> {
  const guest = await Guest.findOne({ _id: guestId, weddingId })
    .session(session ?? null)
    .lean();
  const wedding = await Wedding.findById(weddingId)
    .session(session ?? null)
    .lean();
  if (!guest || !wedding) throw missing();
  const assignments = await EventGuest.find({ weddingId, guestId })
    .session(session ?? null)
    .lean();
  const events = await WeddingEvent.find({
    weddingId,
    _id: { $in: assignments.map((a) => a.eventId) },
  })
    .sort({ startsAt: 1, _id: 1 })
    .session(session ?? null)
    .lean();
  const date = (value: Date) =>
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "long",
      timeZone: "Asia/Kolkata",
    }).format(value);
  const time = (value: Date) =>
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(value) + " IST";
  const couple = `${wedding.brideName} & ${wedding.groomName}`;
  const content = {
    recipient: guest.email,
    guestName: guest.name,
    couple,
    subject: `${couple.replace(/[\r\n]+/g, " ")} invite you to celebrate their wedding`,
    weddingDate: date(wedding.weddingDate),
    city: wedding.city,
    greeting: `Hi ${guest.name},`,
    introduction:
      "We would love to celebrate our wedding with you. Below are the celebrations reserved for you. Open your private invitation to view the latest details and let us know if you can join us.",
    events: events.map((event) => ({
      name: event.name,
      when: time(event.startsAt),
      venue:
        [event.venue?.name, event.venue?.address].filter(Boolean).join(" · ") ||
        "Venue to be confirmed",
    })),
    expiresAt: new Date(
      Math.max(
        wedding.weddingDate.getTime() + 7 * 86400000,
        Math.ceil(Date.now() / 86400000) * 86400000 + 7 * 86400000,
      ),
    ).toISOString(),
  };
  return {
    ...content,
    previewHash: createHash("sha256")
      .update(JSON.stringify(content))
      .digest("hex"),
  };
}
function attemptDTO(
  row: AccessRecord & { _id: mongoose.Types.ObjectId },
): GuestEmailAttempt {
  return {
    id: row._id.toString(),
    recipient: row.emailRecipient ?? "",
    status: row.emailStatus ?? "FAILED",
    createdAt: row.createdAt.toISOString(),
    sentAt: row.sentAt?.toISOString() ?? null,
    expiresAt: row.expiresAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
  };
}
export async function attempts(weddingId: string, guestId: string) {
  return (
    await GuestAccessToken.find({
      weddingId,
      guestId,
      emailRequestId: { $exists: true },
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(20)
      .lean()
  ).map(attemptDTO);
}
export async function beginEmail(
  userId: string,
  weddingId: string,
  guestId: string,
  input: GuestEmailInput,
  tokenHash: string,
) {
  const indexes = await GuestAccessToken.collection.indexes();
  if (
    !indexes.some(
      (i) =>
        i.unique &&
        i.key.tokenHash === 1 &&
        Object.keys(i.key).length === 1 &&
        !i.sparse &&
        !i.partialFilterExpression,
    )
  )
    throw new HttpError(
      503,
      "PROVIDER_UNAVAILABLE",
      "Invitation indexes need setup.",
    );
  return mongoose.connection.transaction(async (session) => {
    const member = await WeddingMember.findOne({
      weddingId,
      userId,
      role: { $in: ["ADMIN", "MANAGER"] },
    }).session(session);
    if (!member) throw new HttpError(404, "NOT_FOUND", "Wedding not found.");
    const locked = await Guest.updateOne(
      { _id: guestId, weddingId },
      { $inc: { __v: 1 } },
      { session },
    );
    if (!locked.matchedCount) throw missing();
    // A crashed worker cannot retain an active, unconfirmed capability indefinitely.
    await GuestAccessToken.updateMany(
      {
        weddingId,
        guestId,
        emailStatus: "SENDING",
        createdAt: { $lt: new Date(Date.now() - 60000) },
      },
      { $set: { emailStatus: "FAILED", revokedAt: new Date() } },
      { session },
    );
    const previous = await GuestAccessToken.findOne({
      weddingId,
      guestId,
      emailRequestId: input.requestId,
    }).session(session);
    if (previous) {
      if (previous.emailStatus === "SENT")
        return { duplicate: true as const, attempt: attemptDTO(previous) };
      throw new HttpError(
        409,
        "INVALID_STATE",
        previous.emailStatus === "SENDING"
          ? "This invitation is still being sent. Wait a moment and check again."
          : "This attempt did not complete. Reload the preview to start a new send.",
      );
    }
    if (
      await GuestAccessToken.exists({
        weddingId,
        guestId,
        emailStatus: "SENDING",
      }).session(session)
    )
      throw new HttpError(
        409,
        "INVALID_STATE",
        "An invitation is already being sent to this guest. Wait a moment and refresh.",
      );
    const preview = await emailPreview(weddingId, guestId, session);
    if (!z.email().safeParse(preview.recipient).success)
      throw new HttpError(
        400,
        "VALIDATION_ERROR",
        "Add a valid email address to this guest before sending.",
      );
    if (preview.previewHash !== input.previewHash)
      throw new HttpError(
        409,
        "CONFLICT",
        "Guest or celebration details changed. Reload the preview before sending.",
      );
    const [row] = await GuestAccessToken.create(
      [
        {
          weddingId,
          guestId,
          tokenHash,
          createdBy: userId,
          expiresAt: new Date(preview.expiresAt),
          emailRecipient: preview.recipient,
          emailRequestId: input.requestId,
          emailStatus: "SENDING",
        },
      ],
      { session },
    );
    return { duplicate: false as const, id: row._id.toString(), preview };
  });
}
export async function failedEmail(
  weddingId: string,
  guestId: string,
  id: string,
) {
  await GuestAccessToken.updateOne(
    { _id: id, weddingId, guestId, emailStatus: "SENDING" },
    { $set: { emailStatus: "FAILED", revokedAt: new Date() } },
  );
}
export async function completeEmail(
  weddingId: string,
  guestId: string,
  id: string,
  recipient: string,
  providerMessageId: string,
) {
  return mongoose.connection.transaction(async (session) => {
    const guest = await Guest.updateOne(
      { _id: guestId, weddingId, email: recipient },
      { $inc: { __v: 1 } },
      { session },
    );
    const row = guest.matchedCount
      ? await GuestAccessToken.findOneAndUpdate(
          {
            _id: id,
            weddingId,
            guestId,
            emailStatus: "SENDING",
            revokedAt: null,
            expiresAt: { $gt: new Date() },
          },
          {
            $set: {
              emailStatus: "SENT",
              sentAt: new Date(),
              providerMessageId,
            },
          },
          { session, returnDocument: "after" },
        )
      : null;
    if (row) return attemptDTO(row);
    await GuestAccessToken.updateOne(
      { _id: id, weddingId, guestId, emailStatus: "SENDING" },
      { $set: { emailStatus: "FAILED", revokedAt: new Date() } },
      { session },
    );
    return null;
  });
}
