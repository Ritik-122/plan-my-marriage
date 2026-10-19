import { AcceptInvitation } from "@/components/team/accept-invitation";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Wedding invitation | Plan My Marriage",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function AcceptPage() {
  return <AcceptInvitation />;
}
