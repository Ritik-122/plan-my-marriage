import Link from "next/link";
import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { eventsForPage } from "@/modules/events/page-data";
import { eventDate, eventTime, typeNames } from "@/modules/events/schema";
import {
  EventShell,
  VisibilityBadge,
  eventButton,
} from "@/components/events/event-shell";
export const metadata = { title: "Wedding events | Plan My Marriage" };
export default async function EventsPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const user = await requireUser();
  const { weddingId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  const events = await eventsForPage(user.id, weddingId);
  const base = `/app/weddings/${weddingId}/events`;
  return (
    <EventShell wedding={wedding}>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-secondary">
            Your celebrations
          </p>
          <h1 className="mt-3 font-display-sm text-display-sm-mobile text-primary md:text-display-sm">
            Wedding Events
          </h1>
          <p className="mt-3 max-w-xl text-body-md text-on-surface-variant">
            Plan every celebration in one place. Your schedule, from the first
            gathering to the final goodbye.
          </p>
        </div>
        <Link className={eventButton} href={`${base}/new`}>
          + Add event
        </Link>
      </div>
      <div className="my-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Total celebrations", String(events.length).padStart(2, "0")],
          [
            "First celebration",
            events[0] ? eventDate(events[0].startsAt) : "Not planned yet",
          ],
          [
            "Venues added",
            `${events.filter((e) => e.venue.name).length} of ${events.length}`,
          ],
        ].map(([label, value]) => (
          <section key={label} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-outline">
              {label}
            </p>
            <p className="mt-4 break-words font-headline-md text-title-lg text-primary">
              {value}
            </p>
          </section>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-headline-md text-headline-md text-primary">
          Chronological itinerary
        </h2>
        <span className="text-body-sm text-on-surface-variant">
          All times in IST
        </span>
      </div>
      {events.length === 0 ? (
        <section className="rounded-xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center">
          <h3 className="font-headline-md text-headline-md text-primary">
            Your celebrations start here.
          </h3>
          <p className="mx-auto mt-3 mb-6 max-w-md text-body-md text-on-surface-variant">
            Add your first ceremony, family gathering, or custom tradition to
            bring your wedding schedule to life.
          </p>
          <Link href={`${base}/new`} className={eventButton}>
            Add your first event
          </Link>
        </section>
      ) : (
        <ol className="space-y-4">
          {events.map((event, index) => (
            <li
              key={event.id}
              className={`grid items-start gap-5 rounded-xl border-l-4 bg-white p-5 shadow-sm md:grid-cols-[150px_minmax(0,1fr)] ${event.type === "WEDDING" ? "border-primary" : "border-transparent"}`}
            >
              <div className="flex gap-3">
                <span className="rounded-lg bg-surface-container px-3 py-2 text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-body-sm text-on-surface-variant">
                  {eventDate(event.startsAt)}
                </p>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-2 text-xs uppercase tracking-widest text-secondary">
                      {typeNames[event.type]}
                    </p>
                    <h3 className="break-words font-headline-md text-headline-md text-primary">
                      <Link href={`${base}/${event.id}`}>{event.name}</Link>
                    </h3>
                  </div>
                  <VisibilityBadge visibility={event.visibility} />
                </div>
                <p className="mt-3 text-body-sm">
                  {eventTime(event.startsAt)}
                  {event.endsAt
                    ? ` – ${eventDate(event.endsAt) === eventDate(event.startsAt) ? "" : eventDate(event.endsAt) + " · "}${eventTime(event.endsAt)}`
                    : ""}{" "}
                  IST
                </p>
                <p className="mt-2 break-words text-body-sm text-on-surface-variant">
                  {event.venue.name || "Venue to be confirmed"}
                  {event.venue.address ? ` · ${event.venue.address}` : ""}
                </p>
                <div className="mt-4 flex justify-end gap-4">
                  <Link
                    href={`${base}/${event.id}/edit`}
                    className="rounded-lg border border-outline-variant px-4 py-2 text-label-lg text-primary"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`${base}/${event.id}`}
                    className="rounded-lg bg-primary-container px-4 py-2 text-label-lg text-white"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      {events.length > 0 && (
        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-secondary-fixed/25 p-6">
          <div>
            <h2 className="font-headline-md text-title-lg text-primary">
              Planning additional traditions?
            </h2>
            <p className="mt-2 text-body-sm">
              Make room for the celebrations that are uniquely yours.
            </p>
          </div>
          <Link
            href={`${base}/new`}
            className="text-label-lg text-primary underline"
          >
            Add a custom celebration
          </Link>
        </section>
      )}
    </EventShell>
  );
}
