import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { EventShell } from "@/components/events/event-shell";
import { WeddingDashboard } from "@/components/weddings/dashboard";
export const metadata = { title: "Wedding Dashboard | Plan My Marriage" };
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const user = await requireUser();
  const { weddingId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  return (
    <EventShell wedding={wedding} active="dashboard">
      <WeddingDashboard wedding={wedding} />
    </EventShell>
  );
}
