import Link from "next/link";
import { requireUser } from "@/modules/auth/current-user";
import { weddingsForPage } from "@/modules/weddings/page-data";
import { formatWeddingDate, themeNames } from "@/modules/weddings/schema";
import { WorkspaceHeader } from "@/components/weddings/workspace-header";
export const metadata = { title: "Your weddings | Plan My Marriage" };
export default async function WelcomePage() {
  const user = await requireUser();
  const weddings = await weddingsForPage(user.id);
  return (
    <div className="min-h-screen bg-surface">
      <WorkspaceHeader />
      <main className="mx-auto max-w-5xl px-margin py-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="mb-3 text-label-md uppercase tracking-widest text-secondary">
              Your shared beginning
            </p>
            <h1 className="break-words font-display-sm text-display-sm text-primary">
              Welcome, {user.displayName}.
            </h1>
            <p className="mt-4 text-body-lg text-on-surface-variant">
              Your weddings, all in one place.
            </p>
          </div>
          <Link
            href="/app/weddings/new"
            className="rounded-lg bg-primary-container px-6 py-3 text-label-lg text-white shadow-sm hover:bg-primary"
          >
            Create Wedding
          </Link>
        </div>
        {weddings.length ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {weddings.map((wedding) => (
              <Link
                key={wedding.id}
                href={`/app/weddings/${wedding.id}`}
                className="min-w-0 rounded-xl border border-transparent bg-white p-6 shadow-sm hover:border-primary/30"
              >
                <p className="mb-3 text-label-md uppercase tracking-widest text-secondary">
                  {wedding.role === "ADMIN" ? "Admin" : "Manager"} ·{" "}
                  {themeNames[wedding.theme]}
                </p>
                <h2 className="break-words font-headline-lg text-headline-lg text-primary">
                  {wedding.brideName} &amp; {wedding.groomName}
                </h2>
                <p className="mt-3 text-body-md text-on-surface-variant">
                  {formatWeddingDate(wedding.weddingDate)}
                </p>
                <p className="mt-1 break-words text-body-md text-on-surface-variant">
                  {wedding.city}
                </p>
                <p className="mt-5 text-label-lg text-primary">
                  Open wedding →
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <section className="mt-10 rounded-xl bg-white p-8 shadow-sm">
            <h2 className="font-headline-md text-headline-md text-primary">
              A little space for a big celebration.
            </h2>
            <p className="mt-3 text-body-md text-on-surface-variant">
              You haven’t created a wedding yet. Start with your details, choose
              a style, and review before creating your workspace.
            </p>
          </section>
        )}
        <p className="mt-6 text-body-sm text-on-surface-variant">
          Unfinished setup? Open Create Wedding to resume a draft saved on this
          device.
        </p>
        <p className="mt-5 break-all text-body-sm text-on-surface-variant">
          Signed in as {user.email}
        </p>
      </main>
    </div>
  );
}
