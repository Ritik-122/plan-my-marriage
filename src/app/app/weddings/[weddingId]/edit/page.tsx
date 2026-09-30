import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { WorkspaceHeader } from "@/components/weddings/workspace-header";
import { EditWedding } from "@/components/weddings/edit-wedding";
export const metadata = { title: "Edit wedding | Plan My Marriage" };
export default async function EditPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const user = await requireUser();
  const wedding = await weddingForPage(user.id, (await params).weddingId);
  return (
    <div className="min-h-screen bg-surface">
      <WorkspaceHeader />
      <main className="mx-auto max-w-3xl px-margin py-10">
        <h1 className="mb-8 font-display-sm text-display-sm text-primary">
          Edit your wedding
        </h1>
        <EditWedding wedding={wedding} />
      </main>
    </div>
  );
}
