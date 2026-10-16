import Link from "next/link";
import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { EventShell } from "@/components/events/event-shell";
import { EventForm } from "@/components/events/event-form";
export const metadata = { title: "Add event | Plan My Marriage" };
export default async function NewEvent({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const user = await requireUser();
  const { weddingId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  return (
    <EventShell wedding={wedding}>
      <Link
        href={`/app/weddings/${weddingId}/events`}
        className="text-body-sm text-primary"
      >
        ← Back to schedule
      </Link>
      <h1 className="mt-5 font-display-sm text-display-sm-mobile text-primary md:text-display-sm">
        Add Event
      </h1>
      <p className="mt-3 mb-8 text-body-md text-on-surface-variant">
        Give your celebration a name, a time, and a place.
      </p>
      <EventForm weddingId={weddingId} />
    </EventShell>
  );
}
