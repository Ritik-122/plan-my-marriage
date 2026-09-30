import { redirect } from "next/navigation";
import { AuthPage } from "@/components/auth/auth-page";
import { currentUser } from "@/modules/auth/current-user";
export const metadata = { title: "Sign in | Plan My Marriage" };
export default async function SignInPage() {
  if (await currentUser()) redirect("/app");
  return <AuthPage mode="login" />;
}
