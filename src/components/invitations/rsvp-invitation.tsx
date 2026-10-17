"use client";
import { useRef, useState } from "react";
import type { InvitationDTO } from "@/modules/invitations/dto";
import { InvitationView, palettes } from "./invitation-view";
import { RsvpStatus } from "@/components/guests/rsvp-status";
import { eventDate, eventTime } from "@/modules/events/schema";
type Choice = "ATTENDING" | "NOT_ATTENDING";
export function RsvpInvitation({
  invitation,
  token,
  onInvalid,
  onReload,
}: {
  invitation: InvitationDTO;
  token: string;
  onInvalid: () => void;
  onReload: () => void;
}) {
  const [saved, setSaved] = useState(invitation);
  const [choices, setChoices] = useState<Record<string, Choice>>(() =>
    Object.fromEntries(
      invitation.events
        .filter((e) => e.rsvpStatus !== "PENDING")
        .map((e) => [e.id, e.rsvpStatus as Choice]),
    ),
  );
  const [pending, setPending] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const missing = saved.events.filter((e) => !choices[e.id]).length;
  const changes = saved.events
    .filter((e) => choices[e.id] && choices[e.id] !== e.rsvpStatus)
    .map((e) => ({ eventId: e.id, status: choices[e.id] }));
  async function submit() {
    if (saving.current) return;
    if (missing) {
      setError("Please choose a response for each celebration.");
      return;
    }
    if (!changes.length) {
      setConfirmed(true);
      window.scrollTo(0, 0);
      return;
    }
    saving.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/v1/guest/rsvps", {
        method: "PATCH",
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ responses: changes }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.error?.code === "GUEST_LINK_INVALID") {
          onInvalid();
          return;
        }
        if (result.error?.code === "FORBIDDEN") setStale(true);
        setError(
          result.error?.message ??
            "We couldn’t save your responses. Please try again.",
        );
        return;
      }
      const accepted = result.data.responses as {
        eventId: string;
        status: Choice;
      }[];
      setSaved((current) => ({
        ...current,
        events: current.events.map((e) => ({
          ...e,
          rsvpStatus:
            accepted.find((r) => r.eventId === e.id)?.status ?? e.rsvpStatus,
        })),
      }));
      setConfirmed(true);
      window.scrollTo(0, 0);
    } catch {
      setError(
        "We couldn’t confirm your responses were saved. Your choices are still here; please try again.",
      );
    } finally {
      saving.current = false;
      setPending(false);
    }
  }
  if (confirmed)
    return (
      <main
        className={`min-h-screen px-5 py-12 ${palettes[saved.wedding.theme]}`}
      >
        <div className="mx-auto max-w-xl">
          <header className="text-center">
            <div
              aria-hidden="true"
              className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--invite-tint)] text-2xl"
            >
              ✓
            </div>
            <p className="text-xs uppercase tracking-[.2em]">
              Response confirmation
            </p>
            <h1
              tabIndex={-1}
              ref={(node) => {
                node?.focus();
              }}
              className="mt-5 break-words font-headline-md text-4xl outline-none"
            >
              Thank you, {saved.guest.name}.
            </h1>
            <p role="status" className="mt-4 text-sm">
              Your responses have been saved.
            </p>
            <p className="mt-3 text-sm leading-7">
              You can revisit your private invitation link to update your
              responses.
            </p>
          </header>
          <section className="mt-8 rounded-xl border border-[var(--invite-border)] bg-white p-6">
            <h2 className="font-headline-md text-2xl">Attendance summary</h2>
            <ul className="mt-5 space-y-4">
              {saved.events.map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg bg-[var(--invite-tint)] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="min-w-0 break-words font-headline-md text-xl">
                      {e.name}
                    </h3>
                    <RsvpStatus status={e.rsvpStatus} />
                  </div>
                  <p className="mt-3 text-xs leading-6">
                    {eventDate(e.startsAt)} · {eventTime(e.startsAt)} IST
                  </p>
                  <p className="mt-1 break-words text-xs">
                    {e.venue.name || "Venue to be confirmed"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
          <button
            className="mt-6 w-full rounded-lg bg-[var(--invite-accent)] px-5 py-4 text-sm text-white"
            onClick={() => {
              setConfirmed(false);
              setError("");
              window.scrollTo(0, 0);
            }}
          >
            Edit responses
          </button>
          <button
            className="mt-3 w-full rounded-lg border border-[var(--invite-border)] px-5 py-4 text-sm"
            onClick={() => {
              setConfirmed(false);
              window.scrollTo(0, 0);
            }}
          >
            View invitation &amp; directions
          </button>
          <p className="mt-8 text-center text-xs">
            Powered by Plan My Marriage
          </p>
        </div>
      </main>
    );
  return (
    <InvitationView
      invitation={saved}
      responseControl={(event) => (
        <fieldset
          disabled={pending || stale}
          className="mt-6 border-t border-[var(--invite-border)] pt-5"
        >
          <legend className="px-1 text-sm font-semibold">
            RSVP for {event.name}
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["ATTENDING", "NOT_ATTENDING"] as const).map((status) => (
              <label
                key={status}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--invite-border)] px-2 py-3 text-xs ${choices[event.id] === status ? "bg-[var(--invite-accent)] text-white" : "bg-white"}`}
              >
                <input
                  type="radio"
                  name={`rsvp-${event.id}`}
                  value={status}
                  checked={choices[event.id] === status}
                  onChange={() => {
                    setChoices((current) => ({
                      ...current,
                      [event.id]: status,
                    }));
                    setError("");
                  }}
                />
                {status === "ATTENDING" ? "Attending" : "Not attending"}
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs opacity-75">
            {event.rsvpStatus === "PENDING"
              ? "No response saved yet"
              : `Saved response: ${event.rsvpStatus === "ATTENDING" ? "Attending" : "Not attending"}`}
          </p>
        </fieldset>
      )}
      responseFooter={
        saved.events.length > 0 && (
          <section className="mt-6 rounded-xl border border-[var(--invite-border)] bg-white p-5">
            <h2 className="font-headline-md text-2xl">
              Will you be joining us?
            </h2>
            <p className="mt-3 text-sm leading-6">
              Choose a response for each celebration, then confirm below. You
              can change your mind later.
            </p>
            {error && (
              <p role="alert" className="mt-4 text-sm text-error">
                {error}
              </p>
            )}
            {stale ? (
              <button
                onClick={onReload}
                className="mt-5 w-full rounded-lg bg-[var(--invite-accent)] px-4 py-4 text-sm text-white"
              >
                Reload invitation (discard edits)
              </button>
            ) : (
              <button
                disabled={pending}
                onClick={submit}
                className="mt-5 w-full rounded-lg bg-[var(--invite-accent)] px-4 py-4 text-sm text-white disabled:opacity-50"
              >
                {pending
                  ? "Saving responses…"
                  : changes.length || missing
                    ? "Confirm responses"
                    : "View saved responses"}
              </button>
            )}
            {changes.length > 0 && (
              <p className="mt-3 text-xs">
                Your changes are not saved until you confirm.
              </p>
            )}
          </section>
        )
      }
    />
  );
}
