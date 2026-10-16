import Link from "next/link";
import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { eventsForPage } from "@/modules/events/page-data";
import { guestsForPage } from "@/modules/guests/page-data";
import { guestFiltersSchema } from "@/modules/guests/schema";
import { EventShell, eventButton } from "@/components/events/event-shell";
export const metadata = { title: "Guests | Plan My Marriage" };
export default async function Guests({
  params,
  searchParams,
}: {
  params: Promise<{ weddingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const { weddingId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  const events = await eventsForPage(user.id, weddingId);
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  const eventId = typeof query.eventId === "string" ? query.eventId : "";
  const parsed = guestFiltersSchema.safeParse({
    q,
    eventId: eventId || undefined,
    cursor: query.cursor,
    limit: 20,
  });
  const base = `/app/weddings/${weddingId}/guests`;
  if (!parsed.success)
    return (
      <EventShell wedding={wedding} active="guests">
        <h1 className="font-headline-md text-headline-md text-primary">
          Check your guest filters
        </h1>
        <Link href={base} className="mt-4 inline-block underline">
          Reset guest list
        </Link>
      </EventShell>
    );
  const result = await guestsForPage(user.id, weddingId, parsed.data);
  const next = new URLSearchParams({
    ...(q ? { q } : {}),
    ...(eventId ? { eventId } : {}),
    ...(result.nextCursor ? { cursor: result.nextCursor } : {}),
  });
  return (
    <EventShell wedding={wedding} active="guests">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-secondary">
            Your guest directory
          </p>
          <h1 className="mt-3 font-display-sm text-display-sm-mobile text-primary md:text-display-sm">
            Guests
          </h1>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Manage everyone invited to your wedding celebrations.
          </p>
        </div>
        <Link href={`${base}/new`} className={eventButton}>
          + Add guest
        </Link>
      </div>
      <div className="my-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Total guests", result.total],
          ["Matching guests", result.matched],
          ["Wedding events", events.length],
        ].map(([label, value]) => (
          <section key={label} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-outline">
              {label}
            </p>
            <p className="mt-3 font-headline-md text-headline-md text-primary">
              {value}
            </p>
          </section>
        ))}
      </div>
      <form
        action={base}
        className="mb-6 flex flex-wrap items-end gap-4 rounded-xl bg-white p-5"
      >
        <div className="min-w-0 flex-1 basis-60">
          <label htmlFor="search-guests" className="mb-2 block text-label-lg">
            Search guests
          </label>
          <input
            key={q}
            id="search-guests"
            name="q"
            defaultValue={q}
            maxLength={100}
            placeholder="Name, email, or phone"
            className="w-full rounded-lg border border-outline-variant px-3 py-3 text-base"
          />
        </div>
        <div className="min-w-0 flex-1 basis-48">
          <label htmlFor="event-filter" className="mb-2 block text-label-lg">
            Event
          </label>
          <select
            key={eventId}
            id="event-filter"
            name="eventId"
            defaultValue={eventId}
            className="w-full rounded-lg border border-outline-variant px-3 py-3 text-base"
          >
            <option value="">All events</option>
            {events.map((e) => (
              <option value={e.id} key={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <button className={eventButton}>Apply filters</button>
        <Link href={base} className="py-3 text-label-lg text-primary underline">
          Reset
        </Link>
      </form>
      {result.data.length === 0 ? (
        <section className="rounded-xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center">
          <h2 className="font-headline-md text-headline-md text-primary">
            {result.total === 0
              ? "Every celebration starts with your people."
              : "No guests match these filters."}
          </h2>
          <p className="mt-3 mb-6 text-body-md text-on-surface-variant">
            {result.total === 0
              ? "Add your first guest and choose the events they’re invited to."
              : "Try another name or event, or reset the filters."}
          </p>
          <Link
            href={result.total === 0 ? `${base}/new` : base}
            className={eventButton}
          >
            {result.total === 0 ? "Add your first guest" : "Reset filters"}
          </Link>
        </section>
      ) : (
        <section
          aria-label="Guest directory"
          className="overflow-hidden rounded-xl bg-white shadow-sm"
        >
          <div className="hidden grid-cols-[1.1fr_1fr_1.2fr_auto] gap-4 border-b border-outline-variant/30 bg-surface-container-low p-5 text-xs uppercase tracking-widest text-outline md:grid">
            <span>Guest</span>
            <span>Contact info</span>
            <span>Assigned events</span>
            <span>Actions</span>
          </div>
          <ul className="divide-y divide-outline-variant/30">
            {result.data.map((guest) => (
              <li
                key={guest.id}
                className="grid items-start gap-4 p-5 md:grid-cols-[1.1fr_1fr_1.2fr_auto]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-fixed/50 text-sm text-primary"
                  >
                    {guest.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <Link
                    href={`${base}/${guest.id}`}
                    className="break-words text-label-lg text-primary"
                  >
                    {guest.name}
                  </Link>
                </div>
                <div className="min-w-0 break-words text-body-sm text-on-surface-variant">
                  <p>{guest.phone || "No phone added"}</p>
                  <p className="mt-1 break-all">
                    {guest.email || "No email added"}
                  </p>
                </div>
                <div className="flex min-w-0 flex-wrap gap-2">
                  {guest.events.length ? (
                    guest.events.map((e) => (
                      <span
                        key={e.id}
                        className="max-w-full break-words rounded bg-surface-container px-2 py-1 text-xs"
                      >
                        {e.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-body-sm text-outline">
                      No events assigned
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-label-lg text-primary">
                  <Link href={`${base}/${guest.id}`}>View</Link>
                  <Link href={`${base}/${guest.id}/edit`}>Edit</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-body-sm text-on-surface-variant">
        <p>
          Showing {result.data.length} of {result.matched} matching guests
        </p>
        <div className="flex gap-5">
          {query.cursor && (
            <Link
              href={`${base}?${new URLSearchParams({ q, eventId })}`}
              className="text-primary underline"
            >
              First page
            </Link>
          )}
          {result.nextCursor && (
            <Link href={`${base}?${next}`} className="text-primary underline">
              Next page →
            </Link>
          )}
        </div>
      </div>
    </EventShell>
  );
}
