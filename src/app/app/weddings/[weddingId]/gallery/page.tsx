import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { getMediaConfig, ConfigurationError } from "@/lib/config/env.server";
import { EventShell } from "@/components/events/event-shell";
import { GalleryWorkspace } from "@/components/gallery/gallery-workspace";
export const metadata = { title: "Wedding Gallery | Plan My Marriage" };
export default async function GalleryPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const user = await requireUser();
  const { weddingId } = await params;
  const wedding = await weddingForPage(user.id, weddingId);
  let ready = false;
  let maxBytes = 10485760;
  try {
    maxBytes = getMediaConfig().MAX_IMAGE_BYTES;
    ready = true;
  } catch (error) {
    if (!(error instanceof ConfigurationError)) throw error;
  }
  return (
    <EventShell wedding={wedding} active="gallery">
      <GalleryWorkspace
        weddingId={weddingId}
        storageReady={ready}
        maxBytes={maxBytes}
      />
    </EventShell>
  );
}
