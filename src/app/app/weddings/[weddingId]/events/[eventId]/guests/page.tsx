import Link from "next/link";
import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { eventForPage } from "@/modules/events/page-data";
import { guestsForPage } from "@/modules/guests/page-data";
import { eventRsvpCounts } from "@/modules/guests/service";
import { guestFiltersSchema } from "@/modules/guests/schema";
import { EventShell } from "@/components/events/event-shell";
import { RsvpStatus } from "@/components/guests/rsvp-status";
import { RefreshRsvps } from "@/components/guests/refresh-rsvps";
import { eventDate, eventTime } from "@/modules/events/schema";
export const metadata = { title: "Guests & RSVPs | Plan My Marriage" };
export default async function EventGuestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ weddingId: string; eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const { weddingId, eventId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  const event = await eventForPage(user.id, weddingId, eventId);
  const query = await searchParams;
  const parsed = guestFiltersSchema.safeParse({
    eventId,
    q: query.q,
    rsvpStatus: query.rsvpStatus || undefined,
    cursor: query.cursor,
  });
  const base = `/app/weddings/${weddingId}/events/${eventId}`;
  if (!parsed.success)
    return (
      <EventShell wedding={wedding}>
        <h1 className="text-2xl">Invalid guest filters</h1>
        <Link className="mt-5 block underline" href={`${base}/guests`}>
          Reset filters
        </Link>
      </EventShell>
    );
  const guests = await guestsForPage(user.id, weddingId, parsed.data);
  let counts;
  try {
    counts = await eventRsvpCounts(user.id, weddingId, eventId);
  } catch {
    throw new Error("RSVP counts are temporarily unavailable.");
  }
  const next = new URLSearchParams();
  if (parsed.data.q) next.set("q", parsed.data.q);
  if (parsed.data.rsvpStatus) next.set("rsvpStatus", parsed.data.rsvpStatus);
  if (guests.nextCursor) next.set("cursor", guests.nextCursor);
  return (
    <EventShell wedding={wedding}>
      <Link href={base} className="text-sm text-primary">
        ← Back to event
      </Link>
      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-secondary">
            Guests &amp; RSVPs
          </p>
          <h1 className="mt-3 break-words font-headline-md text-4xl text-primary">
            {event.name} Guests
          </h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            {eventDate(event.startsAt)} · {eventTime(event.startsAt)} IST
          </p>
        </div>
        <RefreshRsvps />
      </header>
      <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Total assigned", counts.total],
          ["Attending", counts.attending],
          ["Not attending", counts.notAttending],
          ["Pending", counts.pending],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-5 shadow-sm">
            <dt className="text-xs uppercase tracking-wide text-on-surface-variant">
              {label}
            </dt>
            <dd className="mt-3 font-headline-md text-3xl text-primary">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {counts.pending > 0 && (
        <p className="mt-6 rounded-lg bg-secondary-fixed/25 p-5 text-sm">
          Waiting for {counts.pending}{" "}
          {counts.pending === 1 ? "guest" : "guests"} to respond. Open a guest’s
          details to manage their invitation links.
        </p>
      )}
      <section className="mt-7 rounded-xl bg-white p-5 shadow-sm sm:p-7">
        <form
          action={`${base}/guests`}
          className="flex flex-wrap items-end gap-4"
        >
          <label className="w-full min-w-0 text-sm sm:w-auto sm:flex-1">
            Search guests
            <input
              name="q"
              defaultValue={parsed.data.q ?? ""}
              maxLength={100}
              placeholder="Name, email or phone"
              className="mt-2 block w-full rounded-lg border border-outline-variant p-3"
            />
          </label>
          <div className="text-sm">
            <label htmlFor="rsvp-status">RSVP status</label>
            <select
              id="rsvp-status"
              name="rsvpStatus"
              defaultValue={parsed.data.rsvpStatus ?? ""}
              className="mt-2 block rounded-lg border border-outline-variant p-3"
            >
              <option value="">All responses</option>
              <option value="ATTENDING">Attending</option>
              <option value="NOT_ATTENDING">Not attending</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <button className="rounded-lg bg-primary px-5 py-3 text-sm text-white">
            Apply filters
          </button>
          <Link
            href={`${base}/guests`}
            className="p-3 text-sm text-primary underline"
          >
            Reset
          </Link>
        </form>
        <p className="my-5 text-xs text-outline">
          {guests.matched} matching guests · Counts above include all assigned
          guests.
        </p>
        {guests.data.length === 0 ? (
          <p className="rounded-lg bg-surface-container-low p-6 text-sm">
            No guests match this view. Assign guests from the guest directory or
            change your filters.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/40">
            {guests.data.map((guest) => (
              <li
                key={guest.id}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div className="w-full min-w-0 sm:w-auto sm:flex-1">
                  <h2 className="break-words font-semibold text-primary">
                    {guest.name}
                  </h2>
                  <p className="mt-2 break-all text-xs text-on-surface-variant">
                    {guest.email || guest.phone || "No contact details"}
                  </p>
                  <p className="mt-2 text-xs text-outline">
                    {guest.respondedAt
                      ? `Responded ${eventDate(guest.respondedAt)} · ${eventTime(guest.respondedAt)} IST`
                      : "Awaiting response"}
                  </p>
                </div>
                <RsvpStatus status={guest.rsvpStatus ?? "PENDING"} />
                <Link
                  href={`/app/weddings/${weddingId}/guests/${guest.id}`}
                  className="rounded-lg border border-outline-variant px-4 py-2 text-sm"
                >
                  View guest
                </Link>
              </li>
            ))}
          </ul>
        )}
        <nav aria-label="Guest pages" className="mt-5 flex gap-5">
          {parsed.data.cursor && (
            <Link
              className="text-sm underline"
              href={`${base}/guests?${new URLSearchParams({ ...(parsed.data.q ? { q: parsed.data.q } : {}), ...(parsed.data.rsvpStatus ? { rsvpStatus: parsed.data.rsvpStatus } : {}) })}`}
            >
              First page
            </Link>
          )}
          {guests.nextCursor && (
            <Link className="text-sm underline" href={`${base}/guests?${next}`}>
              Next page →
            </Link>
          )}
        </nav>
      </section>
    </EventShell>
  );
}
