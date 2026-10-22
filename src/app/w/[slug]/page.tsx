import { GuestWebsite } from "@/components/website/guest-website";
import { publicWebsiteForPage } from "@/modules/website/page-data";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Wedding celebration | Plan My Marriage",
  robots: { index: false, follow: false },
};
export default async function WeddingWebsitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <GuestWebsite wedding={await publicWebsiteForPage((await params).slug)} />
  );
}
