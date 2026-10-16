import Link from "next/link";
import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { eventForPage } from "@/modules/events/page-data";
import { EventShell } from "@/components/events/event-shell";
import { EventForm } from "@/components/events/event-form";
export const metadata = { title: "Edit event | Plan My Marriage" };
export default async function EditEvent({
  params,
}: {
  params: Promise<{ weddingId: string; eventId: string }>;
}) {
  const user = await requireUser();
  const { weddingId, eventId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  const event = await eventForPage(user.id, weddingId, eventId);
  return (
    <EventShell wedding={wedding}>
      <Link
        href={`/app/weddings/${weddingId}/events/${eventId}`}
        className="text-body-sm text-primary"
      >
        ← Back to event
      </Link>
      <h1 className="mt-5 mb-8 font-display-sm text-display-sm-mobile text-primary md:text-display-sm">
        Edit Event
      </h1>
      <EventForm weddingId={weddingId} event={event} />
    </EventShell>
  );
}
