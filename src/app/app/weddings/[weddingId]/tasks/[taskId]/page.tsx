import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { EventShell } from "@/components/events/event-shell";
import { TaskWorkspace } from "@/components/tasks/task-workspace";
export const metadata = { title: "Wedding Tasks | Plan My Marriage" };
export default async function TaskPage({
  params,
}: {
  params: Promise<{ weddingId: string; taskId?: string }>;
}) {
  const user = await requireUser();
  const { weddingId, taskId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  return (
    <EventShell wedding={wedding} active="tasks">
      <TaskWorkspace weddingId={weddingId} taskId={taskId} />
    </EventShell>
  );
}
