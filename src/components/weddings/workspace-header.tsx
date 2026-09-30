import Link from "next/link";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/auth/sign-out-button";
export function WorkspaceHeader() {
  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-margin py-6">
      <Brand />
      <div className="flex flex-wrap items-center gap-5">
        <Link href="/app" className="text-label-lg text-primary">
          Your weddings
        </Link>
        <SignOutButton />
      </div>
    </header>
  );
}
