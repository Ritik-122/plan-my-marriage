"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { GuestEmailState } from "@/modules/invitations/email-dto";
import { eventDate, eventTime } from "@/modules/events/schema";
const primary =
  "rounded-lg bg-primary-container px-5 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-50";
const secondary =
  "rounded-lg border border-outline-variant px-4 py-3 text-primary disabled:opacity-50";
export function GuestEmailPanel({
  weddingId,
  guestId,
}: {
  weddingId: string;
  guestId: string;
}) {
  const api = `/api/v1/weddings/${weddingId}/guests/${guestId}/invitations/email`;
  const [state, setState] = useState<GuestEmailState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"preview" | "sent" | "failed" | "unknown">(
    "preview",
  );
  const [open, setOpen] = useState(false);
  const requestId = useRef("");
  const dialog = useRef<HTMLDialogElement>(null);
  async function load() {
    const response = await fetch(api, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message ?? "Could not load email details.");
    setState(result.data as GuestEmailState);
    return result.data as GuestEmailState;
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch(api, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(
            "Could not load email details. Use Refresh to try again.",
          );
        if (!controller.signal.aborted) setState(result.data);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Could not load email details. Use Refresh to try again.");
      });
    return () => controller.abort();
  }, [api]);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  async function preview() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await load();
      requestId.current = crypto.randomUUID();
      setPhase("preview");
      setOpen(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load preview.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    if (busy || !state) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestId.current,
          previewHash: state.preview.previewHash,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setPhase("failed");
        setError(
          result.error?.message ??
            "Email sending failed. Reload the preview before retrying.",
        );
      } else {
        setPhase("sent");
        window.dispatchEvent(new Event("pmm:invitation-links-changed"));
      }
    } catch {
      setPhase("unknown");
      setError(
        "The result could not be confirmed. Check the latest status before starting a new send. Retry this attempt safely using the same request.",
      );
    } finally {
      try {
        // Keep the reviewed content stable after failure/unknown responses.
        const history = await fetch(api, { cache: "no-store" });
        if (history.ok) {
          const fresh = await history.json();
          setState((current) =>
            current ? { ...current, attempts: fresh.data.attempts } : current,
          );
        }
      } catch {
        /* Preserve the send outcome if refreshing history fails. */
      }
      setBusy(false);
    }
  }
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      await load();
    } catch {
      setError("Could not refresh email details.");
    } finally {
      setBusy(false);
    }
  }
  const latest = state?.attempts[0];
  const sentBefore = state?.attempts.some(
    (attempt) => attempt.status === "SENT",
  );
  return (
    <section
      className="rounded-xl bg-white p-6 shadow-sm"
      aria-labelledby="guest-email-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="guest-email-heading"
          className="font-headline-md text-headline-md text-primary"
        >
          Email invitation
        </h2>
        <button
          className="text-sm text-primary underline disabled:opacity-50"
          disabled={busy}
          onClick={() => void refresh()}
        >
          Refresh email status
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">
        Send a personal invitation with this guest’s celebrations and a private
        RSVP link.
      </p>
      <p className="mt-4 break-all text-sm">
        <span className="font-semibold">To:</span>{" "}
        {state
          ? state.preview.recipient || "No email address added"
          : "Loading…"}
      </p>
      {latest && (
        <div
          className={`mt-4 rounded-lg p-4 ${latest.status === "FAILED" ? "bg-error-container/30" : "bg-surface-container-low"}`}
        >
          <p className="font-semibold">
            {latest.status === "SENT"
              ? "Sent to email provider"
              : latest.status === "FAILED"
                ? "Sending failed or unconfirmed"
                : "Sending not yet confirmed"}
          </p>
          <p className="mt-1 break-all text-sm">{latest.recipient}</p>
          <p className="mt-1 text-xs">
            {eventDate(latest.sentAt ?? latest.createdAt)} ·{" "}
            {eventTime(latest.sentAt ?? latest.createdAt)} IST
          </p>
          {latest.revokedAt && (
            <p className="mt-2 text-xs text-error">
              This attempt’s private link has been revoked.
            </p>
          )}
        </div>
      )}
      {!latest && state && (
        <p className="mt-4 rounded-lg bg-surface-container-low p-4 text-sm">
          No email invitations sent yet.
        </p>
      )}
      {state?.localOnly && (
        <p className="mt-4 rounded-lg bg-secondary-fixed/40 p-3 text-sm">
          Local preview: emailed links currently open only on this computer. Set
          a public app URL before inviting guests on other devices.
        </p>
      )}
      {!open && error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-error-container p-3 text-on-error-container"
        >
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        {state?.preview.recipient ? (
          <button
            className={primary}
            disabled={busy}
            onClick={() => void preview()}
          >
            {busy && !open
              ? "Loading…"
              : sentBefore
                ? "Preview & resend invitation"
                : "Preview & send invitation"}
          </button>
        ) : (
          state && (
            <Link
              className={secondary}
              href={`/app/weddings/${weddingId}/guests/${guestId}/edit`}
            >
              Add guest email
            </Link>
          )
        )}
      </div>
      <p className="mt-4 text-xs leading-5 text-on-surface-variant">
        Sent means accepted by Resend, not confirmed inbox delivery. Each new
        send creates a private link; existing shared links remain valid until
        expiry or revocation.
      </p>
      {!!state?.attempts.length && (
        <details className="mt-5 border-t border-outline-variant/30 pt-4">
          <summary className="cursor-pointer text-sm text-primary">
            Recent email attempts ({state.attempts.length})
          </summary>
          <ul className="mt-3 space-y-3">
            {state.attempts.map((attempt) => (
              <li
                key={attempt.id}
                className="rounded-lg bg-surface-container-low p-3 text-xs"
              >
                <p className="break-all">{attempt.recipient}</p>
                <p className="mt-1">
                  {attempt.status === "SENT"
                    ? "Sent to provider"
                    : attempt.status === "FAILED"
                      ? "Failed / unconfirmed"
                      : "Awaiting confirmation"}{" "}
                  · {eventDate(attempt.createdAt)}{" "}
                  {eventTime(attempt.createdAt)} IST
                </p>
                {attempt.revokedAt && <p className="mt-1">Link revoked</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="email-preview-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else setOpen(false);
        }}
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-surface p-5 text-on-surface shadow-xl backdrop:bg-black/40 sm:p-8"
      >
        {state && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-secondary">
                  Personal invitation
                </p>
                <h2
                  id="email-preview-title"
                  className="mt-2 font-headline-md text-headline-md text-primary"
                >
                  {phase === "sent"
                    ? "Invitation sent"
                    : "Preview invitation email"}
                </h2>
              </div>
              <button
                type="button"
                disabled={busy}
                aria-label="Close email preview"
                className="rounded-lg px-3 py-2 text-xl"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <p className="mt-4 break-all text-sm">
              <strong>To:</strong> {state.preview.recipient}
            </p>
            <p className="mt-2 break-words text-sm">
              <strong>Subject:</strong> {state.preview.subject}
            </p>
            {phase === "sent" ? (
              <div
                role="status"
                className="my-6 rounded-xl bg-tertiary-fixed/40 p-6"
              >
                <p className="font-semibold">
                  Resend accepted your invitation.
                </p>
                <p className="mt-2 text-sm">
                  The guest can open their private link to view celebrations and
                  RSVP without an account. Inbox delivery is not yet tracked.
                </p>
              </div>
            ) : (
              <div className="my-6 rounded-xl border border-outline-variant/30 bg-white p-5 sm:p-8">
                <div className="text-center">
                  <p className="text-xs tracking-widest text-secondary">
                    PLAN MY MARRIAGE
                  </p>
                  <h3 className="mt-4 break-words font-headline-lg text-headline-lg text-primary">
                    {state.preview.couple}
                  </h3>
                  <p className="mt-2 break-words text-xs uppercase tracking-wide text-secondary">
                    {state.preview.weddingDate} · {state.preview.city}
                  </p>
                </div>
                <p className="mt-7 break-words font-semibold">
                  {state.preview.greeting}
                </p>
                <p className="mt-3 text-sm leading-6">
                  {state.preview.introduction}
                </p>
                <div className="mt-5 space-y-3">
                  <h4 className="text-xs uppercase tracking-widest text-secondary">
                    Your celebrations
                  </h4>
                  {state.preview.events.length ? (
                    state.preview.events.map((event, index) => (
                      <div
                        key={index}
                        className="rounded-lg bg-surface-container-low p-4"
                      >
                        <p className="break-words font-semibold">
                          {event.name}
                        </p>
                        <p className="mt-2 text-sm">{event.when}</p>
                        <p className="mt-1 break-words text-sm">
                          {event.venue}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm">
                      Your hosts will share the celebration schedule soon.
                    </p>
                  )}
                </div>
                <div className="mt-6 rounded-lg bg-primary-container p-4 text-center text-sm font-semibold text-white">
                  View your private invitation &amp; RSVP
                </div>
                <p className="mt-4 text-xs leading-5 text-on-surface-variant">
                  This invitation is personal to you. Please do not forward it.
                  Your private link expires on{" "}
                  {eventDate(state.preview.expiresAt)} (IST). No account is
                  required to RSVP.
                </p>
              </div>
            )}
            {error && (
              <p
                role="alert"
                className="mb-4 rounded-lg bg-error-container p-4 text-sm text-on-error-container"
              >
                {error}
              </p>
            )}
            {phase !== "sent" && (
              <p className="mb-5 text-xs text-on-surface-variant">
                Preview only: no link is created and no email is sent until you
                confirm. The button above is illustrative.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                className={secondary}
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                {phase === "sent" ? "Done" : "Cancel"}
              </button>
              {phase === "failed" ? (
                <button
                  className={primary}
                  disabled={busy}
                  onClick={() => void preview()}
                >
                  Reload preview
                </button>
              ) : (
                phase !== "sent" && (
                  <button
                    className={primary}
                    disabled={busy || !state.preview.recipient}
                    onClick={() => void send()}
                  >
                    {busy
                      ? "Sending invitation…"
                      : phase === "unknown"
                        ? "Retry same attempt"
                        : sentBefore
                          ? "Resend invitation email"
                          : "Send invitation email"}
                  </button>
                )
              )}
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
