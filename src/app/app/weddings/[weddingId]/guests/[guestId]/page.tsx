import Link from "next/link";
import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { guestForPage, guestEventsForPage } from "@/modules/guests/page-data";
import { eventDate, eventTime } from "@/modules/events/schema";
import {
  EventShell,
  eventButton,
  VisibilityBadge,
} from "@/components/events/event-shell";
import { DeleteGuest } from "@/components/guests/delete-guest";
import { InvitationPanel } from "@/components/invitations/invitation-panel";
import { GuestEmailPanel } from "@/components/invitations/email-panel";
import { RsvpStatus } from "@/components/guests/rsvp-status";
export const metadata = { title: "Guest details | Plan My Marriage" };
export default async function GuestPage({
  params,
}: {
  params: Promise<{ weddingId: string; guestId: string }>;
}) {
  const user = await requireUser();
  const { weddingId, guestId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  const guest = await guestForPage(user.id, weddingId, guestId);
  const events = await guestEventsForPage(user.id, weddingId, guestId);
  const base = `/app/weddings/${weddingId}/guests`;
  return (
    <EventShell wedding={wedding} active="guests">
      <Link href={base} className="text-body-sm text-primary">
        ← Back to guests
      </Link>
      <section className="mt-6 flex flex-wrap items-end justify-between gap-5 rounded-xl bg-secondary-fixed/20 p-6">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-secondary">
            Guest record
          </p>
          <h1 className="mt-3 break-words font-display-sm text-display-sm-mobile text-primary md:text-display-sm">
            {guest.name}
          </h1>
          <p className="mt-3 text-body-md text-on-surface-variant">
            {events.length}{" "}
            {events.length === 1 ? "celebration" : "celebrations"} assigned
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`${base}/${guestId}/edit`} className={eventButton}>
            Edit details
          </Link>
          <DeleteGuest
            weddingId={weddingId}
            guestId={guestId}
            name={guest.name}
          />
        </div>
      </section>
      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <GuestEmailPanel weddingId={weddingId} guestId={guestId} />
          <section className="min-w-0 rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-headline-md text-headline-md text-primary">
                Assigned events
              </h2>
              <Link
                href={`${base}/${guestId}/edit`}
                className="text-body-sm text-primary underline"
              >
                Edit event assignments
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="rounded-lg bg-surface-container-low p-5 text-body-md text-on-surface-variant">
                No events assigned yet. Edit this guest to select their
                celebrations.
              </p>
            ) : (
              <ol className="space-y-4">
                {events.map((event, index) => (
                  <li
                    key={event.id}
                    className="rounded-lg bg-surface-container-low p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-widest text-secondary">
                        Celebration {index + 1}
                      </span>
                      <VisibilityBadge visibility={event.visibility} />
                      <RsvpStatus status={event.rsvpStatus} />
                    </div>
                    <h3 className="mt-3 break-words font-headline-md text-title-lg text-primary">
                      <Link
                        href={`/app/weddings/${weddingId}/events/${event.id}`}
                      >
                        {event.name}
                      </Link>
                    </h3>
                    <p className="mt-3 text-body-sm text-on-surface-variant">
                      {eventDate(event.startsAt)} · {eventTime(event.startsAt)}{" "}
                      IST
                    </p>
                    <p className="mt-2 break-words text-body-sm text-on-surface-variant">
                      {event.venue.name || "Venue to be confirmed"}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <h2 className="font-headline-md text-headline-md text-primary">
                Planning note
              </h2>
              <span className="text-xs text-secondary">Organizers only</span>
            </div>
            <p className="mt-5 whitespace-pre-wrap break-words text-body-md text-on-surface-variant">
              {guest.notes || "No private notes added."}
            </p>
          </section>
        </div>
        <div className="min-w-0 space-y-6">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="font-headline-md text-headline-md text-primary">
              Contact profile
            </h2>
            <dl className="mt-6 space-y-5">
              <div>
                <dt className="text-xs uppercase tracking-widest text-outline">
                  Phone number
                </dt>
                <dd className="mt-2 break-words text-body-md">
                  {guest.phone || "Not added"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-outline">
                  Email address
                </dt>
                <dd className="mt-2 break-all text-body-md">
                  {guest.email || "Not added"}
                </dd>
              </div>
            </dl>
          </section>
          <InvitationPanel
            weddingId={weddingId}
            guestId={guestId}
            defaultExpiry={new Date(
              Date.parse(wedding.weddingDate) + 7 * 86400000,
            ).toISOString()}
          />
        </div>
      </div>
    </EventShell>
  );
}
