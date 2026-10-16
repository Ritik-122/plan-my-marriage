import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/modules/auth/current-user";
import { previewInvitation } from "@/modules/invitations/service";
import { HttpError } from "@/lib/http/errors";
import { InvitationView } from "@/components/invitations/invitation-view";
export const metadata = {
  title: "Invitation preview | Plan My Marriage",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ weddingId: string; guestId: string }>;
}) {
  const user = await requireUser();
  const { weddingId, guestId } = await params;
  const back = `/app/weddings/${weddingId}/guests/${guestId}`;
  let invitation;
  try {
    invitation = await previewInvitation(user.id, weddingId, guestId);
  } catch (error) {
    if (error instanceof HttpError && [401, 404].includes(error.status))
      notFound();
    return (
      <main className="p-8">
        <h1 className="text-2xl">Preview temporarily unavailable</h1>
        <p className="mt-4">Please try again in a moment.</p>
        <Link className="mt-6 block underline" href={back}>
          Back to guest
        </Link>
      </main>
    );
  }
  return <InvitationView invitation={invitation} previewBack={back} />;
}
