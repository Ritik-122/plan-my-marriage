import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate } from "./service";
import { SESSION_COOKIE } from "./session";
import { HttpError } from "@/lib/http/errors";

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  try {
    return await authenticate(token);
  } catch {
    throw new HttpError(
      503,
      "PROVIDER_UNAVAILABLE",
      "Account service is temporarily unavailable.",
    );
  }
}
// Call in every protected page/read, not only a layout (layouts can be reused).
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  return user;
}
