import { PublicInvitation } from "@/components/invitations/public-invitation";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your invitation | Plan My Marriage",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function InvitationPage() {
  return <PublicInvitation />;
}
