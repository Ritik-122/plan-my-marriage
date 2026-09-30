import { redirect } from "next/navigation";
import { AuthPage } from "@/components/auth/auth-page";
import { currentUser } from "@/modules/auth/current-user";
export const metadata = { title: "Create an account | Plan My Marriage" };
export default async function SignUpPage() {
  if (await currentUser()) redirect("/app");
  return <AuthPage mode="register" />;
}
