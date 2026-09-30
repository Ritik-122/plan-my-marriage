import { requireUser } from "@/modules/auth/current-user";
import { WeddingWizard } from "@/components/weddings/wedding-wizard";
export const metadata = { title: "Create your wedding | Plan My Marriage" };
export default async function NewWeddingPage() {
  const user = await requireUser();
  return <WeddingWizard userId={user.id} displayName={user.displayName} />;
}
