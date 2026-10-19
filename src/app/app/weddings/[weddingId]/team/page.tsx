import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { EventShell } from "@/components/events/event-shell";
import { TeamPanel } from "@/components/team/team-panel";
export const metadata = { title: "Team & Access | Plan My Marriage" };
export default async function TeamPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const user = await requireUser();
  const { weddingId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  return (
    <EventShell wedding={wedding} active="team">
      <TeamPanel weddingId={weddingId} role={wedding.role} />
    </EventShell>
  );
}
