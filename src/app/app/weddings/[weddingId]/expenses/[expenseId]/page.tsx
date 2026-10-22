import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { EventShell } from "@/components/events/event-shell";
import { ExpenseWorkspace } from "@/components/expenses/expense-workspace";
export const metadata = { title: "Wedding Expenses | Plan My Marriage" };
export default async function ExpensePage({
  params,
}: {
  params: Promise<{ weddingId: string; expenseId?: string }>;
}) {
  const user = await requireUser();
  const { weddingId, expenseId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  return (
    <EventShell wedding={wedding} active="expenses">
      <ExpenseWorkspace weddingId={weddingId} expenseId={expenseId} />
    </EventShell>
  );
}
