import Link from "next/link";
import { requireUser } from "@/modules/auth/current-user";
import { weddingForPage } from "@/modules/weddings/page-data";
import { formatWeddingDate, themeNames } from "@/modules/weddings/schema";
import { WorkspaceHeader } from "@/components/weddings/workspace-header";
import { ThemePreview } from "@/components/weddings/theme-preview";
export const metadata = { title: "Wedding overview | Plan My Marriage" };
export default async function Overview({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const user = await requireUser();
  const wedding = await weddingForPage(user.id, (await params).weddingId);
  return (
    <div className="min-h-screen bg-surface">
      <WorkspaceHeader />
      <main className="mx-auto max-w-5xl px-margin py-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="mb-3 text-label-md uppercase tracking-widest text-secondary">
              Your wedding overview ·{" "}
              {wedding.role === "ADMIN" ? "Admin" : "Manager"}
            </p>
            <h1 className="break-words font-display-sm text-display-sm text-primary">
              {wedding.brideName} &amp; {wedding.groomName}
            </h1>
            <p className="mt-3 break-words text-body-lg text-on-surface-variant">
              {formatWeddingDate(wedding.weddingDate)} · {wedding.city}
            </p>
          </div>
          <Link
            href={`/app/weddings/${wedding.id}/edit`}
            className="rounded-lg border border-outline-variant px-5 py-3 text-label-lg text-primary"
          >
            Edit wedding details
          </Link>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="font-headline-md text-headline-md text-primary">
                Your shared beginning
              </h2>
              <p className="mt-3 text-body-md text-on-surface-variant">
                Your wedding has been saved. Ceremony planning is the next
                feature—we’ll build your schedule here as it becomes available.
              </p>
            </section>
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-title-md text-primary">Welcome note</h2>
              <p className="mt-3 whitespace-pre-wrap break-words text-body-md text-on-surface-variant">
                {wedding.description || "You haven’t added a welcome note yet."}
              </p>
            </section>
            <section className="rounded-xl bg-surface-container-low p-6">
              <h2 className="text-title-md text-primary">
                Guest website · Unpublished
              </h2>
              <p className="mt-3 break-all text-body-md">/w/{wedding.slug}</p>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                Your handle is reserved. Guest website publishing and
                invitations come in a later milestone.
              </p>
            </section>
          </div>
          <aside>
            <h2 className="mb-3 text-title-md text-primary">
              {themeNames[wedding.theme]}
            </h2>
            <ThemePreview
              theme={wedding.theme}
              brideName={wedding.brideName}
              groomName={wedding.groomName}
              date={wedding.weddingDate}
              city={wedding.city}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
