import Link from "next/link";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { WeddingDTO } from "@/modules/weddings/dto";
export const eventButton =
  "inline-flex items-center justify-center rounded-lg bg-primary-container px-5 py-3 text-label-lg text-white hover:bg-primary disabled:opacity-50 disabled:cursor-wait";
export function EventShell({
  wedding,
  children,
  active = "events",
}: {
  wedding: WeddingDTO;
  children: React.ReactNode;
  active?: "events" | "guests" | "team" | "tasks";
}) {
  const base = `/app/weddings/${wedding.id}`;
  return (
    <div className="min-h-screen bg-surface lg:pl-60">
      <aside className="border-b border-outline-variant/30 bg-white p-5 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col lg:border-r">
        <Brand />
        <div className="my-6 rounded-lg bg-surface-container-low p-3">
          <p className="text-xs uppercase tracking-widest text-secondary">
            Active wedding
          </p>
          <p className="mt-2 break-words text-label-lg">
            {wedding.brideName} &amp; {wedding.groomName}
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Your planning workspace
          </p>
        </div>
        <nav
          aria-label="Wedding navigation"
          className="flex flex-wrap gap-2 lg:flex-col"
        >
          <Link href={base} className="rounded-lg px-4 py-3 text-label-lg">
            Overview
          </Link>
          <Link
            href={`${base}/events`}
            aria-current={active === "events" ? "page" : undefined}
            className={`rounded-lg px-4 py-3 text-label-lg ${active === "events" ? "bg-primary-container text-white" : ""}`}
          >
            Events
          </Link>
          <Link
            href={`${base}/guests`}
            aria-current={active === "guests" ? "page" : undefined}
            className={`rounded-lg px-4 py-3 text-label-lg ${active === "guests" ? "bg-primary-container text-white" : ""}`}
          >
            Guests
          </Link>
          <Link
            href={`${base}/team`}
            aria-current={active === "team" ? "page" : undefined}
            className={`rounded-lg px-4 py-3 text-label-lg ${active === "team" ? "bg-primary-container text-white" : ""}`}
          >
            Team &amp; Access
          </Link>
          <Link
            href={`${base}/tasks`}
            aria-current={active === "tasks" ? "page" : undefined}
            className={`rounded-lg px-4 py-3 text-label-lg ${active === "tasks" ? "bg-primary-container text-white" : ""}`}
          >
            Tasks
          </Link>
          <Link href="/app" className="rounded-lg px-4 py-3 text-label-lg">
            Your weddings
          </Link>
        </nav>
        <div className="mt-5 border-t border-outline-variant/30 pt-4 lg:mt-auto">
          <SignOutButton />
        </div>
      </aside>
      <main className="mx-auto max-w-6xl px-margin py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
export function VisibilityBadge({
  visibility,
}: {
  visibility: "PUBLIC" | "INVITED_ONLY";
}) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${visibility === "PUBLIC" ? "bg-tertiary-fixed/50 text-tertiary" : "bg-secondary-fixed/60 text-on-secondary-fixed-variant"}`}
    >
      {visibility === "PUBLIC" ? "Public" : "Invite-only"}
    </span>
  );
}
