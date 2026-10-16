"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { GuestDTO } from "@/modules/guests/dto";
import type { EventDTO } from "@/modules/events/dto";
import { createGuestSchema } from "@/modules/guests/schema";
import { eventDate, eventTime } from "@/modules/events/schema";
import { fieldClass } from "@/components/weddings/wedding-details-fields";
type Form = { name: string; email: string; phone: string; notes: string };
export function GuestForm({
  weddingId,
  guest,
  events,
  assigned = [],
}: {
  weddingId: string;
  guest?: GuestDTO;
  events: EventDTO[];
  assigned?: string[];
}) {
  const router = useRouter();
  const base = `/app/weddings/${weddingId}/guests`;
  const [form, setForm] = useState<Form>({
    name: guest?.name ?? "",
    email: guest?.email ?? "",
    phone: guest?.phone ?? "",
    notes: guest?.notes ?? "",
  });
  const [selected, setSelected] = useState<string[]>(assigned);
  const [savedId, setSavedId] = useState(guest?.id);
  const currentAssignments = useRef(new Set(assigned));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const change = (key: keyof Form, value: string) => {
    setForm((old) => ({ ...old, [key]: value }));
    setDirty(true);
    setErrors({});
    if (error === "Check the highlighted guest details.") setError("");
  };
  async function save(e: FormEvent) {
    e.preventDefault();
    if (pending || uncertain) return;
    const parsed = createGuestSchema.safeParse(form);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        fields[String(issue.path[0])] ??= issue.message;
      setErrors(fields);
      setError("Check the highlighted guest details.");
      return;
    }
    const removed = [...currentAssignments.current].filter(
      (id) => !selected.includes(id),
    );
    if (
      removed.length &&
      !window.confirm(
        "Remove the deselected event assignments? Any RSVP responses for those events will also be removed.",
      )
    )
      return;
    setPending(true);
    setError("");
    setErrors({});
    let phase: "guest" | "assignments" = "guest";
    try {
      const response = await fetch(
        `/api/v1/weddings/${weddingId}/guests${savedId ? `/${savedId}` : ""}`,
        {
          method: savedId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        setError(result.error?.message ?? "Could not save this guest.");
        setErrors(result.error?.fields ?? {});
        setPending(false);
        return;
      }
      const id: string = result.data.id;
      setSavedId(id);
      phase = "assignments";
      for (const event of events) {
        const was = currentAssignments.current.has(event.id),
          want = selected.includes(event.id);
        if (was === want) continue;
        const assignment = await fetch(
          `/api/v1/weddings/${weddingId}/events/${event.id}/guests`,
          {
            method: want ? "POST" : "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestIds: [id] }),
          },
        );
        if (!assignment.ok) {
          const result = await assignment.json();
          throw new Error(
            result.error?.message ?? "An event assignment could not be saved.",
          );
        }
        if (want) currentAssignments.current.add(event.id);
        else currentAssignments.current.delete(event.id);
      }
      setDirty(false);
      router.push(`${base}/${id}`);
      router.refresh();
    } catch (err) {
      if (phase === "assignments")
        setError(
          `Guest details are saved, but some event assignments could not be confirmed. ${err instanceof Error ? err.message : ""} Retry Save to finish, or review the guest’s saved events.`,
        );
      else {
        setError(
          "We couldn’t confirm whether the guest was saved. Check the guest list before trying again.",
        );
        if (!savedId) setUncertain(true);
      }
      setPending(false);
    }
  }
  function field(
    key: keyof Form,
    label: string,
    type = "text",
    maxLength = 150,
  ) {
    return (
      <div>
        <label htmlFor={key} className="mb-2 block text-label-lg">
          {label}
        </label>
        <input
          id={key}
          type={type}
          value={form[key]}
          maxLength={maxLength}
          onChange={(e) => change(key, e.target.value)}
          disabled={pending}
          className={fieldClass}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={errors[key] ? `${key}-error` : undefined}
        />
        {errors[key] && (
          <p id={`${key}-error`} className="mt-2 text-sm text-error">
            {errors[key]}
          </p>
        )}
      </div>
    );
  }
  return (
    <form
      onSubmit={save}
      noValidate
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]"
    >
      <div className="min-w-0 space-y-6">
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-error-container/40 p-4 text-on-error-container"
          >
            <p>{error}</p>
            <Link
              href={savedId ? `${base}/${savedId}` : base}
              className="mt-2 inline-block underline"
            >
              {savedId ? "Review saved guest" : "Check guest list"}
            </Link>
          </div>
        )}
        <section className="space-y-6 rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap justify-between gap-2">
            <h2 className="font-headline-md text-headline-md text-primary">
              Guest information
            </h2>
            <span className="text-xs text-outline">* Required</span>
          </div>
          {field("name", "Full name *")}
          <div className="grid gap-5 sm:grid-cols-2">
            {field("phone", "Phone number (optional)", "tel", 40)}
            {field("email", "Email address (optional)", "email", 254)}
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Add a country code for phone numbers. Contact details can be added
            later.
          </p>
          <div>
            <label htmlFor="notes" className="mb-2 block text-label-lg">
              Private planning notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={form.notes}
              maxLength={2000}
              disabled={pending}
              onChange={(e) => change("notes", e.target.value)}
              className={fieldClass}
              aria-describedby="notes-hint"
            />
            <p
              id="notes-hint"
              className="mt-2 text-body-sm text-on-surface-variant"
            >
              {errors.notes ||
                `${form.notes.length}/2000 · Visible only to your wedding’s organizers.`}
            </p>
          </div>
        </section>
        <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="font-headline-md text-headline-md text-primary">
                Which events are they invited to?
              </h2>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                Choose the celebrations this guest should attend.
              </p>
            </div>
            {events.length > 0 && (
              <button
                type="button"
                disabled={pending}
                className="text-label-lg text-primary underline"
                onClick={() => {
                  setSelected(
                    selected.length === events.length
                      ? []
                      : events.map((e) => e.id),
                  );
                  setDirty(true);
                }}
              >
                {selected.length === events.length
                  ? "Clear selection"
                  : "Select all events"}
              </button>
            )}
          </div>
          {events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-outline-variant p-5 text-body-md">
              <p>
                No events yet. You can save this guest now and assign events
                later.
              </p>
              <Link
                href={`/app/weddings/${weddingId}/events/new`}
                className="mt-3 inline-block text-primary underline"
              >
                Add an event
              </Link>
            </div>
          ) : (
            <fieldset disabled={pending} className="space-y-3">
              <legend className="sr-only">Event invitations</legend>
              {events.map((event, index) => (
                <label
                  key={event.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${selected.includes(event.id) ? "border-primary/50 bg-surface" : "border-outline-variant/30"}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(event.id)}
                    onChange={(e) => {
                      setSelected((old) =>
                        e.target.checked
                          ? [...old, event.id]
                          : old.filter((id) => id !== event.id),
                      );
                      setDirty(true);
                    }}
                    className="mt-1 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block break-words font-headline-md text-title-lg text-primary">
                      {index + 1}. {event.name}
                    </span>
                    <span className="mt-1 block text-xs text-secondary">
                      {event.visibility === "PUBLIC" ? "Public" : "Invite-only"}
                    </span>
                    <span className="mt-2 block text-body-sm text-on-surface-variant">
                      {eventDate(event.startsAt)} · {eventTime(event.startsAt)}{" "}
                      IST
                    </span>
                    <span className="mt-1 block break-words text-body-sm text-on-surface-variant">
                      {event.venue.name || "Venue to be confirmed"}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          <p className="mt-5 text-body-sm text-on-surface-variant">
            Assignments are saved for planning. No invitations are sent yet.
          </p>
        </section>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5">
          <span className="text-body-sm text-outline">
            {pending
              ? "Saving guest and event assignments…"
              : dirty
                ? "You have unsaved changes."
                : "Changes are saved when you select Save."}
          </span>
          <div className="flex items-center gap-5">
            <Link
              href={guest ? `${base}/${guest.id}` : base}
              className="text-label-lg text-primary"
              onClick={(e) => {
                if (
                  pending ||
                  (dirty &&
                    !window.confirm("Leave without saving these changes?"))
                )
                  e.preventDefault();
              }}
            >
              Cancel
            </Link>
            <button
              disabled={pending || uncertain}
              className="rounded-lg bg-primary-container px-6 py-3 text-label-lg text-white disabled:opacity-50"
            >
              {pending
                ? "Saving…"
                : guest || savedId
                  ? "Save changes"
                  : "Save guest"}
            </button>
          </div>
        </div>
      </div>
      <aside className="hidden space-y-5 lg:sticky lg:top-6 lg:block">
        <section className="rounded-xl border border-outline-variant/40 bg-white p-5">
          <p className="text-xs uppercase tracking-widest text-secondary">
            Guest plan preview
          </p>
          <h2 className="mt-4 break-words font-headline-md text-headline-md text-primary">
            {form.name || "Your guest"}
          </h2>
          <p className="mt-4 text-body-sm">
            {selected.length}{" "}
            {selected.length === 1 ? "celebration" : "celebrations"} selected
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2 break-words text-body-sm text-on-surface-variant">
            {events
              .filter((e) => selected.includes(e.id))
              .map((e) => (
                <li key={e.id}>{e.name}</li>
              ))}
          </ul>
          <p className="mt-5 text-xs text-outline">
            Private planning preview. Guest invitation links come later.
          </p>
        </section>
        <section className="rounded-xl bg-secondary-fixed/30 p-5">
          <h2 className="text-label-lg text-primary">Planning insight</h2>
          <p className="mt-2 text-body-sm">
            Each guest can have their own combination of celebrations. You can
            adjust assignments as plans evolve.
          </p>
        </section>
      </aside>
    </form>
  );
}
