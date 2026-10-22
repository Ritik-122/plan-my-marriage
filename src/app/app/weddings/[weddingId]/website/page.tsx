import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { previewForPage } from "@/modules/website/page-data";
import { getAppConfig } from "@/lib/config/env.server";
import { EventShell } from "@/components/events/event-shell";
import { WebsiteManager } from "@/components/website/website-manager";
export const dynamic = "force-dynamic";
export const metadata = { title: "Wedding Website | Plan My Marriage" };
export default async function WebsitePage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const user = await requireUser();
  const { weddingId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  const preview = await previewForPage(user.id, weddingId);
  const publicUrl = new URL(`/w/${wedding.slug}`, getAppConfig().APP_BASE_URL)
    .href;
  return (
    <EventShell wedding={wedding} active="website">
      <WebsiteManager
        initialWedding={wedding}
        initialPreview={preview}
        publicUrl={publicUrl}
      />
    </EventShell>
  );
}
