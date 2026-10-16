"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createEventSchema,
  eventTypes,
  typeNames,
  localDateTime,
  toUTC,
  eventDate,
  eventTime,
  type EventInput,
} from "@/modules/events/schema";
import type { EventDTO } from "@/modules/events/dto";
import { fieldClass } from "@/components/weddings/wedding-details-fields";

const button =
  "rounded-lg bg-primary-container px-6 py-3 text-label-lg text-white hover:bg-primary disabled:opacity-50";
type Form = {
  name: string;
  type: EventInput["type"];
  startsAt: string;
  endsAt: string;
  description: string;
  dressCode: string;
  venueName: string;
  address: string;
  mapUrl: string;
  visibility: EventInput["visibility"];
};
export function EventForm({
  weddingId,
  event,
}: {
  weddingId: string;
  event?: EventDTO;
}) {
  const router = useRouter();
  const base = `/app/weddings/${weddingId}/events`;
  const [form, setForm] = useState<Form>({
    name: event?.name ?? "",
    type: event?.type ?? "CUSTOM",
    startsAt: event ? localDateTime(event.startsAt) : "",
    endsAt: event?.endsAt ? localDateTime(event.endsAt) : "",
    description: event?.description ?? "",
    dressCode: event?.dressCode ?? "",
    venueName: event?.venue.name ?? "",
    address: event?.venue.address ?? "",
    mapUrl: event?.venue.mapUrl ?? "",
    visibility: event?.visibility ?? "INVITED_ONLY",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const set = (key: keyof Form, value: string) => {
    setForm((old) => ({ ...old, [key]: value }));
    setDirty(true);
    setErrors({});
    setError("");
  };
  async function save(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    const parsed = createEventSchema.safeParse({
      name: form.name,
      type: form.type,
      startsAt: toUTC(form.startsAt),
      endsAt: form.endsAt ? toUTC(form.endsAt) : null,
      description: form.description,
      dressCode: form.dressCode,
      venue: {
        name: form.venueName,
        address: form.address,
        mapUrl: form.mapUrl,
      },
      visibility: form.visibility,
    });
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        fields[String(issue.path[0])] ??=
          issue.path[0] === "startsAt"
            ? "Choose a valid start date and time."
            : issue.message;
      setErrors(fields);
      setError("Check the highlighted event details.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/v1/weddings/${weddingId}/events${event ? `/${event.id}` : ""}`,
        {
          method: event ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        setError(result.error?.message ?? "Unable to save this event.");
        setErrors(result.error?.fields ?? {});
        setPending(false);
        return;
      }
      setDirty(false);
      router.push(`${base}/${result.data.id}`);
      router.refresh();
    } catch {
      setError(
        "We couldn’t confirm the save. Check your schedule before trying again.",
      );
      setPending(false);
    }
  }
  function input(
    key: keyof Form,
    label: string,
    type = "text",
    maxLength = 200,
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
          onChange={(e) => set(key, e.target.value)}
          maxLength={maxLength}
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
  const start = toUTC(form.startsAt);
  return (
    <form
      noValidate
      onSubmit={save}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]"
    >
      <div className="min-w-0 space-y-6">
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-error-container/50 p-4 text-on-error-container"
          >
            {error}{" "}
            <Link href={base} className="underline">
              View schedule
            </Link>
          </div>
        )}
        <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-headline-md text-headline-md text-primary">
            1 / Event details
          </h2>
          {input("name", "Event name *", "text", 150)}
          <fieldset disabled={pending}>
            <legend className="mb-3 text-label-lg">Event type</legend>
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((type) => (
                <label
                  key={type}
                  className={`cursor-pointer rounded-full border px-3 py-2 text-sm focus-within:outline-2 focus-within:outline-primary ${form.type === type ? "border-primary bg-primary-container text-white" : "border-outline-variant"}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="type"
                    value={type}
                    checked={form.type === type}
                    onChange={() => set("type", type)}
                  />
                  {typeNames[type]}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="description" className="mb-2 block text-label-lg">
              Short description
            </label>
            <textarea
              id="description"
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              disabled={pending}
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-outline">
              {form.description.length}/2000 · Plain text
            </p>
          </div>
          {input("dressCode", "Dress code (optional)")}
        </section>
        <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-headline-md text-headline-md text-primary">
            2 / Date &amp; time
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            All times are in India Standard Time (Asia/Kolkata).
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {input("startsAt", "Start date & time *", "datetime-local")}
            {input("endsAt", "End date & time (optional)", "datetime-local")}
          </div>
        </section>
        <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-headline-md text-headline-md text-primary">
            3 / Venue &amp; directions
          </h2>
          {input("venueName", "Venue name (optional)")}
          {input("address", "Address (optional)", "text", 500)}
          {input("mapUrl", "Map link (optional)", "url", 2048)}
          {errors.venue && (
            <p role="alert" className="text-sm text-error">
              {errors.venue}
            </p>
          )}
          <p className="text-body-sm text-on-surface-variant">
            Paste an http or https map link for directions.
          </p>
        </section>
        <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-headline-md text-headline-md text-primary">
            4 / Visibility &amp; access
          </h2>
          <fieldset disabled={pending}>
            <legend className="sr-only">Event visibility</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["INVITED_ONLY", "PUBLIC"] as const).map((v) => (
                <label
                  key={v}
                  className={`cursor-pointer rounded-lg border p-4 ${form.visibility === v ? "border-primary bg-surface" : "border-outline-variant/40"}`}
                >
                  <span className="flex items-center gap-2 text-label-lg">
                    <input
                      type="radio"
                      name="visibility"
                      checked={form.visibility === v}
                      onChange={() => set("visibility", v)}
                    />
                    {v === "PUBLIC" ? "Public" : "Invite-only"}
                  </span>
                  <p className="mt-3 text-body-sm text-on-surface-variant">
                    {v === "PUBLIC"
                      ? "Eligible to appear on your future published wedding website."
                      : "Reserved for guests assigned to this event. Recommended."}
                  </p>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-body-sm text-on-surface-variant">
            Saving this setting does not publish your website or send
            invitations.
          </p>
        </section>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5">
          <span className="text-body-sm text-outline">
            {pending
              ? "Saving your event…"
              : dirty
                ? "You have unsaved changes."
                : "Changes are saved when you select Save."}
          </span>
          <div className="flex items-center gap-5">
            <Link
              href={event ? `${base}/${event.id}` : base}
              onClick={(e) => {
                if (
                  pending ||
                  (dirty &&
                    !window.confirm("Discard your unsaved event changes?"))
                )
                  e.preventDefault();
              }}
              className="text-label-lg text-primary"
            >
              Cancel
            </Link>
            <button disabled={pending} className={button}>
              {pending ? "Saving…" : event ? "Save changes" : "Save event"}
            </button>
          </div>
        </div>
      </div>
      <aside className="hidden space-y-5 lg:sticky lg:top-6 lg:block">
        <section className="rounded-xl border border-outline-variant/40 bg-white p-5">
          <p className="text-xs uppercase tracking-widest text-secondary">
            Live event preview
          </p>
          <h2 className="mt-4 break-words font-headline-md text-headline-md text-primary">
            {form.name || "Your celebration"}
          </h2>
          <p className="mt-3 whitespace-pre-wrap break-words text-body-sm text-on-surface-variant">
            {form.description || "A little about the celebration…"}
          </p>
          <p className="mt-5 text-body-sm">
            {start
              ? `${eventDate(start)} · ${eventTime(start)} IST`
              : "Date & time to be set"}
          </p>
          <p className="mt-3 break-words text-body-sm">
            {form.venueName || "Venue to be confirmed"}
          </p>
        </section>
        <section className="rounded-xl bg-secondary-fixed/30 p-5">
          <h2 className="text-label-lg text-primary">Planning advice</h2>
          <p className="mt-2 text-body-sm">
            Leave time between celebrations for travel and a little rest.
          </p>
        </section>
      </aside>
    </form>
  );
}
