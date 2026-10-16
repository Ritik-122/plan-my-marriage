import Link from "next/link";
import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { eventsForPage } from "@/modules/events/page-data";
import { guestForPage, guestEventsForPage } from "@/modules/guests/page-data";
import { EventShell } from "@/components/events/event-shell";
import { GuestForm } from "@/components/guests/guest-form";
export const metadata = { title: "Edit guest | Plan My Marriage" };
export default async function EditGuest({
  params,
}: {
  params: Promise<{ weddingId: string; guestId: string }>;
}) {
  const user = await requireUser();
  const { weddingId, guestId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  const guest = await guestForPage(user.id, weddingId, guestId);
  const events = await eventsForPage(user.id, weddingId);
  const assigned = await guestEventsForPage(user.id, weddingId, guestId);
  return (
    <EventShell wedding={wedding} active="guests">
      <Link
        href={`/app/weddings/${weddingId}/guests/${guestId}`}
        className="text-body-sm text-primary"
      >
        ← Back to guest
      </Link>
      <h1 className="mt-5 mb-8 font-display-sm text-display-sm-mobile text-primary md:text-display-sm">
        Edit Guest
      </h1>
      <GuestForm
        weddingId={weddingId}
        guest={guest}
        events={events}
        assigned={assigned.map((e) => e.id)}
      />
    </EventShell>
  );
}
