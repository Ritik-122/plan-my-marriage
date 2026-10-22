import { requireUser } from "@/modules/auth/current-user";
import { previewForPage } from "@/modules/website/page-data";
import { GuestWebsite } from "@/components/website/guest-website";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private website preview | Plan My Marriage",
  robots: { index: false, follow: false },
};
export default async function WebsitePreviewPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const user = await requireUser();
  const { weddingId } = await params;
  const wedding = await previewForPage(user.id, weddingId);
  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-3 bg-primary-container px-4 py-3 text-center text-body-sm text-white">
        <p>Private preview · Only public wedding details are shown.</p>
        <a
          className="underline"
          href={`/app/weddings/${weddingId}/website`}
          target="_top"
        >
          Back to website settings
        </a>
      </div>
      <GuestWebsite wedding={wedding} />
    </>
  );
}
