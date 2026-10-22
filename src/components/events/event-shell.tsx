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
  active?:
    | "events"
    | "guests"
    | "team"
    | "tasks"
    | "expenses"
    | "dashboard"
    | "website";
}) {
  const base = `/app/weddings/${wedding.id}`;
  return (
    <div className="min-h-screen bg-surface lg:pl-60">
      <aside className="border-b border-outline-variant/30 bg-white p-5 lg:fixed lg:inset-y-0 lg:left-0 lg:overflow-y-auto lg:flex lg:w-60 lg:flex-col lg:border-r">
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
          {(
            [
              ["dashboard", "Dashboard", base],
              ["events", "Events", base + "/events"],
              ["tasks", "Tasks", base + "/tasks"],
              ["expenses", "Expenses", base + "/expenses"],
              ["guests", "Guests", base + "/guests"],
              ["website", "Wedding Website", base + "/website"],
              ["team", "Team & Access", base + "/team"],
            ] as const
          ).map(([key, label, href]) => (
            <Link
              key={key}
              href={href}
              aria-current={active === key ? "page" : undefined}
              className={`rounded-lg px-4 py-3 text-label-lg ${active === key ? "bg-primary-container text-white" : "hover:bg-surface-container-low"}`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/app?select=1"
            className="rounded-lg px-4 py-3 text-label-lg"
          >
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
