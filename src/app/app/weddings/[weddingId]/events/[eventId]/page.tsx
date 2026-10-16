import Link from "next/link";
import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { eventForPage } from "@/modules/events/page-data";
import { eventDate, eventTime, typeNames } from "@/modules/events/schema";
import {
  EventShell,
  VisibilityBadge,
  eventButton,
} from "@/components/events/event-shell";
import { DeleteEvent } from "@/components/events/delete-event";
export const metadata = { title: "Event details | Plan My Marriage" };
export default async function EventPage({
  params,
}: {
  params: Promise<{ weddingId: string; eventId: string }>;
}) {
  const user = await requireUser();
  const { weddingId, eventId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  const event = await eventForPage(user.id, weddingId, eventId);
  const base = `/app/weddings/${weddingId}/events`;
  return (
    <EventShell wedding={wedding}>
      <Link href={base} className="text-body-sm text-primary">
        ← Back to schedule
      </Link>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-secondary">
              {typeNames[event.type]}
            </span>
            <VisibilityBadge visibility={event.visibility} />
          </div>
          <h1 className="mt-4 break-words font-display-sm text-display-sm-mobile text-primary md:text-display-sm">
            {event.name}
          </h1>
          <p className="mt-4 text-body-md text-on-surface-variant">
            {eventDate(event.startsAt)} · {eventTime(event.startsAt)} IST
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <DeleteEvent
            weddingId={weddingId}
            eventId={eventId}
            name={event.name}
          />
          <Link className={eventButton} href={`${base}/${eventId}/edit`}>
            Edit event
          </Link>
        </div>
      </div>
      <div className="mt-8 grid items-start gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs uppercase tracking-widest text-secondary">
              About the celebration
            </p>
            <p className="mt-4 whitespace-pre-wrap break-words text-body-md text-on-surface-variant">
              {event.description ||
                "Add a description to share what makes this celebration special."}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-surface-container-low p-4">
                <h2 className="text-label-lg text-primary">Timing</h2>
                <p className="mt-2 text-body-sm">
                  Starts {eventDate(event.startsAt)} ·{" "}
                  {eventTime(event.startsAt)} IST
                </p>
                <p className="mt-2 text-body-sm">
                  {event.endsAt
                    ? `Ends ${eventDate(event.endsAt)} · ${eventTime(event.endsAt)} IST`
                    : "End time not set"}
                </p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4">
                <h2 className="text-label-lg text-primary">Dress code</h2>
                <p className="mt-2 break-words text-body-sm">
                  {event.dressCode || "Not specified"}
                </p>
              </div>
            </div>
          </section>
          <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-headline-md text-headline-md text-primary">
              Venue &amp; access
            </h2>
            <p className="mt-4 break-words text-label-lg">
              {event.venue.name || "Venue to be confirmed"}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-body-md text-on-surface-variant">
              {event.venue.address}
            </p>
            {event.venue.mapUrl && (
              <a
                className="mt-4 inline-block text-label-lg text-primary underline"
                href={event.venue.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open map ↗
              </a>
            )}
          </section>
        </div>
        <section className="rounded-xl bg-secondary-fixed/25 p-6">
          <h2 className="font-headline-md text-title-lg text-primary">
            Visibility &amp; access
          </h2>
          <p className="mt-4 text-body-md text-on-surface-variant">
            {event.visibility === "PUBLIC"
              ? "This event is eligible to appear on your wedding’s public website when publishing becomes available."
              : "This event is reserved for guests assigned to it. Guest assignments and invitations will be available in a later milestone."}
          </p>
          <p className="mt-4 text-body-sm">
            Your wedding website remains unpublished.
          </p>
        </section>
      </div>
    </EventShell>
  );
}
