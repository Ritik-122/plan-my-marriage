"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { WeddingDTO } from "@/modules/weddings/dto";
import type { PublicWebsiteDTO } from "@/modules/website/dto";
import {
  themes,
  themeNames,
  formatWeddingDate,
  type Theme,
} from "@/modules/weddings/schema";
import { ThemePreview } from "@/components/weddings/theme-preview";
import { eventButton } from "@/components/events/event-shell";
import { eventDate, eventTime } from "@/modules/events/schema";

const card =
  "rounded-xl border border-outline-variant/20 bg-white p-5 shadow-sm sm:p-7";
const secondary =
  "inline-flex items-center justify-center rounded-lg border border-outline-variant px-4 py-3 text-label-lg text-primary disabled:opacity-50";
export function WebsiteManager({
  initialWedding,
  initialPreview,
  publicUrl,
}: {
  initialWedding: WeddingDTO;
  initialPreview: PublicWebsiteDTO;
  publicUrl: string;
}) {
  const [wedding, setWedding] = useState(initialWedding);
  const [preview, setPreview] = useState(initialPreview);
  const [note, setNote] = useState(initialWedding.description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [unknown, setUnknown] = useState(false);
  const [confirmation, setConfirmation] = useState<boolean | null>(null);
  const [mobile, setMobile] = useState(false);
  const [revision, setRevision] = useState(0);
  const base = `/app/weddings/${wedding.id}`;
  const api = `/api/v1/weddings/${wedding.id}`;
  async function refresh() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const responses = await Promise.all([
        fetch(api, { cache: "no-store" }),
        fetch(`${api}/website/preview`, { cache: "no-store" }),
      ]);
      const results = await Promise.all(responses.map((r) => r.json()));
      if (responses.some((r) => !r.ok))
        throw new Error(
          "Could not refresh website settings. Please try again.",
        );
      setWedding(results[0].data);
      setNote(results[0].data.description);
      setPreview(results[1].data);
      setUnknown(false);
      setConfirmation(null);
      setRevision((r) => r + 1);
      setNotice("Website settings refreshed.");
    } catch {
      setError("Could not refresh website settings. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function save(patch: {
    theme?: Theme;
    description?: string;
    website?: { isPublished: boolean };
  }) {
    if (busy || unknown) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(api, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(
          result.error?.message ?? "Could not save your website settings.",
        );
        return;
      }
      const updated: WeddingDTO = result.data;
      setWedding(updated);
      setPreview((p) => ({
        ...p,
        theme: updated.theme,
        description: updated.description,
      }));
      if (patch.description !== undefined) setNote(updated.description);
      setConfirmation(null);
      setRevision((r) => r + 1);
      setNotice(
        patch.website
          ? updated.website.isPublished
            ? "Your wedding website is now published."
            : "Your wedding website is now unpublished."
          : "Website changes saved.",
      );
    } catch {
      setUnknown(true);
      setError(
        "The save could not be confirmed. Refresh website settings to check the saved state before trying again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setNotice("Website link copied.");
    } catch {
      setNotice("Select and copy the website address below.");
    }
  }
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-secondary">
            Public presence
          </p>
          <h1 className="mt-3 font-display-sm text-4xl text-primary">
            Wedding Website
          </h1>
          <p className="mt-3 max-w-xl text-on-surface-variant">
            A welcoming place to share your celebrations with family and
            friends.
          </p>
        </div>
        <a
          href={`${base}/website/preview`}
          target="_blank"
          rel="noopener noreferrer"
          className={eventButton}
        >
          Preview website<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </header>
      <div className="flex flex-wrap items-center gap-4">
        <button
          disabled={busy}
          onClick={refresh}
          className="text-body-sm text-secondary underline disabled:opacity-50"
        >
          Refresh website settings
        </button>
        <span className="text-body-sm text-on-surface-variant">
          Refreshing also reloads the saved welcome note.
        </span>
      </div>
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-tertiary-fixed/40 p-4 text-tertiary"
        >
          {notice}
        </p>
      )}
      {error && confirmation === null && (
        <p
          role="alert"
          className="rounded-lg bg-error-container p-4 text-on-error-container"
        >
          {error}
        </p>
      )}
      <section
        className={`${card} grid gap-6 md:grid-cols-[1.5fr_1fr]`}
        aria-label="Publication status"
      >
        <div>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${wedding.website.isPublished ? "bg-tertiary-fixed/50 text-tertiary" : "bg-surface-container-low text-primary"}`}
          >
            {wedding.website.isPublished ? "Published · Live" : "Unpublished"}
          </span>
          <h2 className="mt-4 font-headline-md text-2xl text-primary">
            {wedding.website.isPublished
              ? "Ready to share with your guests"
              : "Your celebration, ready when you are"}
          </h2>
          <p className="my-4 text-body-md text-on-surface-variant">
            {wedding.website.isPublished
              ? "Anyone with this link can view your public wedding details. Saved changes appear on the website immediately."
              : "Preview your website privately, then publish it when you’re ready to share."}
          </p>
          <label className="block text-label-lg">
            Website address
            <input
              readOnly
              value={publicUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-2 w-full min-w-0 rounded-lg bg-surface-container-low p-3 text-body-sm"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className={secondary} onClick={copyLink}>
              Copy link
            </button>
            {wedding.website.isPublished && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={secondary}
              >
                Open live website
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            <button
              disabled={busy || unknown}
              onClick={() => {
                setError("");
                setConfirmation(!wedding.website.isPublished);
              }}
              className={eventButton}
            >
              {wedding.website.isPublished
                ? "Unpublish website"
                : "Publish website"}
            </button>
          </div>
        </div>
        <aside className="rounded-lg bg-surface-container-low p-5">
          <h3 className="text-lg font-semibold text-primary">Guest privacy</h3>
          <p className="mt-3 text-body-md">
            Only public wedding details and events marked Public appear here.
          </p>
          <p className="mt-3 text-body-sm text-on-surface-variant">
            Invite-only ceremonies, guest contacts, RSVP responses, tasks, and
            expenses stay private. Personalized invitation links work
            independently of this website.
          </p>
        </aside>
      </section>
      <section aria-labelledby="website-theme-heading">
        <p className="text-xs uppercase tracking-widest text-secondary">
          Your celebration’s style
        </p>
        <h2
          id="website-theme-heading"
          className="mt-2 font-headline-md text-3xl text-primary"
        >
          Theme &amp; visual direction
        </h2>
        <p className="my-3 text-body-sm text-on-surface-variant">
          Choose a theme to apply it. If your website is published, the change
          is immediately visible to guests.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {themes.map((theme) => (
            <button
              key={theme}
              disabled={busy || unknown}
              aria-pressed={wedding.theme === theme}
              aria-label={`Apply ${themeNames[theme]} theme`}
              onClick={() => save({ theme })}
              className={`min-w-0 rounded-xl border-2 bg-white p-3 text-left disabled:opacity-60 ${theme === wedding.theme ? "border-primary" : "border-transparent"}`}
            >
              <h3 className="mb-3 text-label-lg">{themeNames[theme]}</h3>
              <ThemePreview
                theme={theme}
                brideName={wedding.brideName}
                groomName={wedding.groomName}
                date={wedding.weddingDate}
                city={wedding.city}
              />
              <p className="mt-3 text-xs font-semibold uppercase text-secondary">
                {theme === wedding.theme
                  ? "Currently applied"
                  : "Click to apply"}
              </p>
            </button>
          ))}
        </div>
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-3">
        <section className={card}>
          <p className="text-xs uppercase tracking-widest text-secondary">
            Couple details
          </p>
          <h2 className="my-4 break-words font-headline-md text-2xl text-primary">
            {wedding.brideName} &amp; {wedding.groomName}
          </h2>
          <p>{formatWeddingDate(wedding.weddingDate)}</p>
          <p className="mt-2 break-words text-on-surface-variant">
            {wedding.city}
          </p>
          <Link className={`${secondary} mt-5`} href={`${base}/edit`}>
            Edit couple details
          </Link>
        </section>
        <form
          className={card}
          onSubmit={(e) => {
            e.preventDefault();
            void save({ description: note });
          }}
        >
          <h2 className="font-headline-md text-2xl text-primary">
            Welcome note
          </h2>
          <label className="mt-4 block text-body-sm" htmlFor="website-note">
            Your message to guests
          </label>
          <textarea
            id="website-note"
            maxLength={1000}
            rows={6}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-container-low p-3"
          />
          <p className="mt-2 text-xs text-on-surface-variant">
            This message appears publicly when your website is published.{" "}
            {note.length}/1000
          </p>
          <button disabled={busy || unknown} className={`${secondary} mt-4`}>
            Save welcome note
          </button>
        </form>
        <section className={card}>
          <h2 className="font-headline-md text-2xl text-primary">
            Public celebrations
          </h2>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            {preview.events.length} public{" "}
            {preview.events.length === 1 ? "event" : "events"}
          </p>
          {preview.events.length === 0 && (
            <p className="mt-4 text-body-md">
              No events are public yet. Guests will see a message that details
              will follow.
            </p>
          )}
          <ul className="mt-4 space-y-3">
            {preview.events.map((e) => (
              <li
                key={e.id}
                className="rounded-lg bg-surface-container-low p-3"
              >
                <p className="break-words text-label-lg">{e.name}</p>
                <p className="mt-1 text-body-sm">
                  {eventDate(e.startsAt)} · {eventTime(e.startsAt)} IST
                </p>
              </li>
            ))}
          </ul>
          <Link
            href={`${base}/events`}
            className="mt-5 inline-block text-body-sm text-secondary underline"
          >
            Manage events and visibility →
          </Link>
        </section>
      </div>
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-md text-2xl text-primary">
              Guest preview
            </h2>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              Your saved website, visible only to your wedding team until
              published.
            </p>
          </div>
          <div className="flex gap-2" aria-label="Preview size">
            <button
              aria-pressed={!mobile}
              className={secondary}
              onClick={() => setMobile(false)}
            >
              Desktop
            </button>
            <button
              aria-pressed={mobile}
              className={secondary}
              onClick={() => setMobile(true)}
            >
              Mobile
            </button>
          </div>
        </div>
        <div className="mt-5 rounded-lg bg-surface-container-low p-2 sm:p-4">
          <iframe
            key={revision}
            title="Guest website preview"
            src={`${base}/website/preview`}
            className={`mx-auto h-[650px] w-full rounded-lg border border-outline-variant/30 bg-white ${mobile ? "max-w-[375px]" : ""}`}
            loading="lazy"
          />
        </div>
      </section>
      {confirmation !== null && (
        <PublishConfirmation
          publish={confirmation}
          wedding={wedding}
          publicUrl={publicUrl}
          eventCount={preview.events.length}
          busy={busy}
          unknown={unknown}
          error={error}
          onClose={() => {
            setConfirmation(null);
            if (!unknown) setError("");
          }}
          onConfirm={() => save({ website: { isPublished: confirmation } })}
        />
      )}
    </div>
  );
}
function PublishConfirmation({
  publish,
  wedding,
  publicUrl,
  eventCount,
  busy,
  unknown,
  error,
  onClose,
  onConfirm,
}: {
  publish: boolean;
  wedding: WeddingDTO;
  publicUrl: string;
  eventCount: number;
  busy: boolean;
  unknown: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="publication-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onClose();
      }}
      onClose={onClose}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border-t-4 border-primary-container p-6 backdrop:bg-primary/30 sm:p-8"
    >
      <h2
        id="publication-title"
        className="font-headline-md text-3xl text-primary"
      >
        {publish
          ? "Publish your wedding website?"
          : "Unpublish your wedding website?"}
      </h2>
      <p className="mt-4 text-on-surface-variant">
        {publish
          ? `Anyone with the link will be able to view the public details of ${wedding.brideName} & ${wedding.groomName}’s wedding.`
          : "Your public wedding page will no longer be available. Your saved details and theme will be kept, and you can publish again whenever you’re ready."}
      </p>
      <p className="my-5 break-all rounded-lg bg-surface-container-low p-3 text-body-sm">
        {publicUrl}
      </p>
      {publish ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-surface-container-low p-4">
              <h3 className="font-semibold">Will be public</h3>
              <p className="mt-2 text-body-sm">
                Couple names, date, city, welcome note, and {eventCount} public{" "}
                {eventCount === 1 ? "event" : "events"} with venue, map and
                dress-code details.
              </p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-4">
              <h3 className="font-semibold">Stays private</h3>
              <p className="mt-2 text-body-sm">
                Invite-only events, guest contacts, RSVP responses, invitation
                links, tasks and expenses.
              </p>
            </div>
          </div>
          <label className="mt-5 flex items-start gap-3 text-body-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-primary"
            />
            I have reviewed the public details and want to publish this website.
          </label>
        </>
      ) : (
        <p className="rounded-lg bg-surface-container-low p-4 text-body-sm">
          Personalized invitation links and guest RSVPs will continue to work.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-error-container p-3 text-on-error-container"
        >
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button className={secondary} disabled={busy} onClick={onClose}>
          {publish ? "Cancel" : "Keep website live"}
        </button>
        <button
          disabled={busy || unknown || (publish && !confirmed)}
          className={eventButton}
          onClick={onConfirm}
        >
          {busy ? "Saving…" : publish ? "Confirm publish" : "Confirm unpublish"}
        </button>
      </div>
    </dialog>
  );
}
