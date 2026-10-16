import Link from "next/link";
import { Brand } from "@/components/brand";
import type { InvitationDTO } from "@/modules/invitations/dto";
import { eventDate, eventTime } from "@/modules/events/schema";
import { themeNames } from "@/modules/weddings/schema";
const palettes = {
  CLASSIC_INDIAN:
    "bg-[#fcf7f3] text-[#691b32] [--invite-accent:#691b32] [--invite-tint:#f7ede5] [--invite-border:#e8d4ca]",
  MODERN_MINIMAL:
    "bg-[#f5f7f5] text-[#254b40] [--invite-accent:#254b40] [--invite-tint:#edf2ed] [--invite-border:#cfddd4]",
  ROYAL_INDIAN:
    "bg-[#f6f1fa] text-[#49285e] [--invite-accent:#49285e] [--invite-tint:#f0e7f5] [--invite-border:#d7c2ae]",
};
function safeExternal(url: string | null) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password
      ? url
      : undefined;
  } catch {
    return undefined;
  }
}
export function InvitationView({
  invitation,
  previewBack,
}: {
  invitation: InvitationDTO;
  previewBack?: string;
}) {
  const { guest, wedding, events } = invitation;
  return (
    <main
      className={`min-h-screen px-5 py-8 sm:py-12 ${palettes[wedding.theme]}`}
    >
      {previewBack && (
        <div className="mx-auto mb-8 flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--invite-border)] bg-white px-4 py-3 text-sm">
          <Link href={previewBack} className="underline">
            ← Back to guest
          </Link>
          <span>Organizer preview · {themeNames[wedding.theme]}</span>
        </div>
      )}
      <div className="mx-auto max-w-xl">
        <header className="text-center">
          <div
            aria-hidden="true"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[var(--invite-border)] font-headline-md text-xl"
          >
            {wedding.groomName.slice(0, 1)} &amp;{" "}
            {wedding.brideName.slice(0, 1)}
          </div>
          <p className="mt-4 text-xs tracking-wide">
            This invitation is personalized for you
          </p>
        </header>
        <section className="mt-7 overflow-hidden rounded-2xl border border-[var(--invite-border)] bg-white shadow-sm">
          <div className="px-6 pb-9 pt-10 text-center sm:px-10">
            <p className="text-xs uppercase tracking-[.2em]">
              The wedding celebration of
            </p>
            <h1 className="mt-5 break-words font-display-sm text-4xl sm:text-5xl">
              {wedding.groomName}{" "}
              <span className="font-headline-md italic">&amp;</span>{" "}
              {wedding.brideName}
            </h1>
            <p className="mt-5 text-sm leading-6">
              {eventDate(wedding.weddingDate)}
              <br />
              {wedding.city}
            </p>
            <div
              aria-hidden="true"
              className="mx-auto mt-6 h-px w-20 bg-[var(--invite-border)]"
            />
          </div>
          <div className="bg-[var(--invite-tint)] px-6 py-7 text-center sm:px-10">
            <h2 className="break-words font-headline-md text-2xl italic">
              {guest.name}, you’re invited.
            </h2>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">
              {wedding.description ||
                "It would mean so much to have you with us as we celebrate these special moments together."}
            </p>
          </div>
        </section>
        <section className="mt-10" aria-labelledby="celebrations-title">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="celebrations-title" className="font-headline-md text-2xl">
                Your Celebrations
              </h2>
              <p className="mt-2 text-xs">
                A personal invitation to share these moments.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--invite-tint)] px-3 py-1 text-xs">
              {events.length} {events.length === 1 ? "event" : "events"}
            </span>
          </div>
          {events.length === 0 && (
            <p className="mt-5 rounded-xl border border-[var(--invite-border)] bg-white p-6 text-sm leading-7">
              Your celebration details are being arranged. Please check back or
              contact the couple for more information.
            </p>
          )}
          <ol className="mt-5 space-y-5">
            {events.map((event, index) => (
              <li
                key={event.id}
                className="rounded-xl border border-[var(--invite-border)] bg-white p-6 sm:p-7"
              >
                <p className="text-xs uppercase tracking-[.18em]">
                  Celebration {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 break-words font-headline-md text-2xl">
                  {event.name}
                </h3>
                <dl className="mt-5 space-y-4 text-sm leading-6">
                  <div>
                    <dt className="text-xs uppercase tracking-wide opacity-70">
                      When
                    </dt>
                    <dd>
                      {eventDate(event.startsAt)}
                      <br />
                      {eventTime(event.startsAt)}
                      {event.endsAt
                        ? ` – ${eventDate(event.endsAt) === eventDate(event.startsAt) ? "" : `${eventDate(event.endsAt)}, `}${eventTime(event.endsAt)}`
                        : ""}{" "}
                      IST
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide opacity-70">
                      Where
                    </dt>
                    <dd className="break-words">
                      {event.venue.name || "Venue to be confirmed"}
                      {event.venue.address && (
                        <>
                          <br />
                          {event.venue.address}
                        </>
                      )}
                    </dd>
                  </div>
                  {event.dressCode && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide opacity-70">
                        Dress code
                      </dt>
                      <dd className="break-words">{event.dressCode}</dd>
                    </div>
                  )}
                </dl>
                {safeExternal(event.venue.mapUrl) && (
                  <a
                    href={safeExternal(event.venue.mapUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 block rounded-lg border border-[var(--invite-border)] bg-[var(--invite-tint)] px-4 py-3 text-center text-sm"
                  >
                    Open map ↗
                  </a>
                )}
                {safeExternal(event.livestreamUrl) && (
                  <a
                    href={safeExternal(event.livestreamUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block rounded-lg bg-[var(--invite-accent)] px-4 py-3 text-center text-sm text-white"
                  >
                    Watch livestream ↗
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>
        <aside className="mt-6 rounded-xl bg-[var(--invite-tint)] p-5 text-xs leading-6">
          <h2 className="font-semibold">
            Thoughtfully Yours &amp; Confidential
          </h2>
          <p>
            This invitation is personal to you. Please keep your private link
            safe. For questions about the celebrations, contact the couple
            directly.
          </p>
        </aside>
        <footer className="py-10 text-center text-xs leading-6">
          <p className="break-words">
            With warm regards, {wedding.groomName} &amp; {wedding.brideName}
          </p>
          <p className="mt-1 opacity-70">Powered by Plan My Marriage</p>
        </footer>
      </div>
    </main>
  );
}
export function InvitationUnavailable() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-surface px-5 py-10">
      <Brand />
      <section className="my-auto w-full max-w-md rounded-2xl border border-outline-variant/40 bg-white px-7 py-12 text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-low text-2xl text-primary"
        >
          ♡
        </div>
        <h1 className="font-headline-md text-3xl text-primary">
          This invitation link is no longer available.
        </h1>
        <p className="mt-5 text-sm leading-7 text-on-surface-variant">
          The link may have expired or been revoked. Please contact the couple
          or the family coordinator who shared it with you for a fresh link.
        </p>
        <Link
          href="/"
          className="mt-7 block rounded-lg bg-primary px-5 py-3 text-sm text-white"
        >
          Return to Plan My Marriage
        </Link>
      </section>
      <p className="mt-8 text-xs text-outline">
        Curated for timeless celebrations.
      </p>
    </main>
  );
}
