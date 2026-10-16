import Link from "next/link";
import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { eventsForPage } from "@/modules/events/page-data";
import { EventShell } from "@/components/events/event-shell";
import { GuestForm } from "@/components/guests/guest-form";
export const metadata = { title: "Add guest | Plan My Marriage" };
export default async function NewGuest({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const user = await requireUser();
  const { weddingId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  const events = await eventsForPage(user.id, weddingId);
  return (
    <EventShell wedding={wedding} active="guests">
      <Link
        href={`/app/weddings/${weddingId}/guests`}
        className="text-body-sm text-primary"
      >
        ← Back to guests
      </Link>
      <h1 className="mt-5 font-display-sm text-display-sm-mobile text-primary md:text-display-sm">
        Add Guest
      </h1>
      <p className="mt-3 mb-8 text-body-md text-on-surface-variant">
        Add their details and choose which celebrations they’re invited to.
      </p>
      <GuestForm weddingId={weddingId} events={events} />
    </EventShell>
  );
}
