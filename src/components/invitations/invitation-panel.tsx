"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { LinkDTO } from "@/modules/invitations/dto";
import {
  localDateTime,
  toUTC,
  eventDate,
  eventTime,
} from "@/modules/events/schema";
import { eventButton } from "@/components/events/event-shell";
export function InvitationPanel({
  weddingId,
  guestId,
  defaultExpiry,
}: {
  weddingId: string;
  guestId: string;
  defaultExpiry: string;
}) {
  const api = `/api/v1/weddings/${weddingId}/guests/${guestId}/access-links`;
  const [links, setLinks] = useState<LinkDTO[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expiry, setExpiry] = useState(() =>
    localDateTime(
      new Date(
        Math.max(Date.parse(defaultExpiry), Date.now() + 7 * 86400000),
      ).toISOString(),
    ),
  );
  const [now, setNow] = useState(() => Date.now());
  const [issued, setIssued] = useState<{
    accessTokenId: string;
    url: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [revokeId, setRevokeId] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  async function refresh() {
    const response = await fetch(api, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error?.message ?? "Could not load invitation links.",
      );
    setLinks(result.data);
    setLoaded(true);
  }
  useEffect(() => {
    const controller = new AbortController();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const load = () => {
      fetch(api, { cache: "no-store", signal: controller.signal })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok)
            throw new Error(
              result.error?.message ?? "Could not load invitation links.",
            );
          if (!controller.signal.aborted) {
            setLinks(result.data);
            setLoaded(true);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError(
              "Could not load invitation links. Reload this page to try again.",
            );
        });
    };
    load();
    window.addEventListener("pmm:invitation-links-changed", load);
    return () => {
      window.removeEventListener("pmm:invitation-links-changed", load);
      controller.abort();
      clearInterval(timer);
    };
  }, [api]);
  async function generate() {
    if (pending) return;
    const expiresAt = toUTC(expiry);
    if (!expiresAt || Date.parse(expiresAt) <= Date.now()) {
      setError("Choose a future expiration date.");
      return;
    }
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresAt }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error?.message ?? "Could not create the link.");
        return;
      }
      setIssued(result.data);
      setNotice("Link created. Copy it before leaving this page.");
      try {
        await refresh();
      } catch {
        setError(
          "Your link was created. Copy it now, then reload to see its status.",
        );
      }
    } catch {
      setError(
        "Could not confirm link creation. Reload to check issued links before trying again.",
      );
    } finally {
      setPending(false);
    }
  }
  async function revoke() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`${api}/${revokeId}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json();
        setError(result.error?.message ?? "Could not revoke the link.");
        dialog.current?.close();
        return;
      }
      if (issued?.accessTokenId === revokeId) setIssued(null);
      dialog.current?.close();
      setNotice("Invitation link revoked.");
      await refresh();
    } catch {
      dialog.current?.close();
      setError(
        "Could not confirm the link status. Reload before trying again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="rounded-xl border border-outline-variant/40 bg-white p-6 shadow-sm">
      <h2 className="font-headline-md text-headline-md text-primary">
        Private invitation links
      </h2>
      <p className="mt-3 text-body-sm leading-6 text-on-surface-variant">
        A personal invitation showing only this guest’s assigned celebrations.
      </p>
      <Link
        href={`/app/weddings/${weddingId}/guests/${guestId}/invitation`}
        className="mt-4 inline-block text-sm text-primary underline"
      >
        Preview invitation
      </Link>
      <label className="mt-6 block text-sm" htmlFor="invitation-expiry">
        Link expires (IST)
      </label>
      <input
        id="invitation-expiry"
        type="datetime-local"
        value={expiry}
        onChange={(e) => setExpiry(e.target.value)}
        className="mt-2 block w-full min-w-0 rounded-lg border border-outline-variant bg-surface p-3 text-sm"
      />
      <button
        disabled={pending || !loaded}
        onClick={generate}
        className={`${eventButton} mt-4 disabled:opacity-50`}
      >
        {pending ? "Saving…" : "Generate invitation link"}
      </button>
      <p className="mt-3 text-xs leading-6 text-on-surface-variant">
        Each link is shown once. Copy it before leaving. Creating another link
        keeps existing links active.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 text-sm text-primary">
          {notice}
        </p>
      )}
      {issued && (
        <div className="mt-5 rounded-lg bg-surface-container-low p-4">
          <label htmlFor="invitation-url" className="text-xs font-semibold">
            Your new private link
          </label>
          <input
            id="invitation-url"
            readOnly
            value={issued.url}
            onFocus={(e) => e.target.select()}
            className="mt-2 w-full min-w-0 rounded border border-outline-variant bg-white p-3 text-xs"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(issued.url);
                  setNotice("Link copied.");
                } catch {
                  setNotice("Select the link above and copy it manually.");
                }
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white"
            >
              Copy link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`You’re invited! Here is your personal wedding invitation: ${issued.url}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-outline-variant px-4 py-2 text-sm text-primary"
            >
              Share on WhatsApp ↗
            </a>
          </div>
          <p className="mt-3 text-xs leading-6">
            Share only with this guest. Anyone with the link can open their
            invitation.
          </p>
        </div>
      )}
      <h3 className="mt-7 text-sm font-semibold text-primary">Issued links</h3>
      {!loaded && !error && (
        <p role="status" className="mt-3 text-sm">
          Loading links…
        </p>
      )}
      {loaded && links.length === 0 && (
        <p className="mt-3 text-sm text-outline">
          No invitation links created yet.
        </p>
      )}
      <ul className="mt-3 max-h-96 space-y-3 overflow-y-auto">
        {links.map((link) => {
          const status = link.revokedAt
            ? "Revoked"
            : Date.parse(link.expiresAt) <= now
              ? "Expired"
              : "Active";
          return (
            <li
              key={link.id}
              className="rounded-lg border border-outline-variant/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs">
                  {status}
                </span>
                {status === "Active" && (
                  <button
                    disabled={pending}
                    onClick={() => {
                      setRevokeId(link.id);
                      dialog.current?.showModal();
                    }}
                    className="text-sm text-error underline"
                  >
                    Revoke link
                  </button>
                )}
              </div>
              <p className="mt-3 text-xs leading-6">
                Created {eventDate(link.createdAt)} ·{" "}
                {eventTime(link.createdAt)} IST
                <br />
                Expires {eventDate(link.expiresAt)} ·{" "}
                {eventTime(link.expiresAt)} IST
                <br />
                {link.lastUsedAt
                  ? `Last opened ${eventDate(link.lastUsedAt)} · ${eventTime(link.lastUsedAt)} IST`
                  : "Not opened yet"}
              </p>
            </li>
          );
        })}
      </ul>
      <dialog
        ref={dialog}
        aria-labelledby="revoke-link-title"
        onCancel={(e) => {
          if (pending) e.preventDefault();
        }}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-7 shadow-xl backdrop:bg-black/40"
      >
        <h2
          id="revoke-link-title"
          className="font-headline-md text-2xl text-primary"
        >
          Revoke this invitation link?
        </h2>
        <p className="mt-4 text-sm leading-7">
          This link will stop opening the invitation. Other active links for
          this guest will keep working.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-4">
          <button
            autoFocus
            disabled={pending}
            onClick={() => dialog.current?.close()}
            className="rounded-lg border border-outline-variant px-4 py-3"
          >
            Keep link
          </button>
          <button
            disabled={pending}
            onClick={revoke}
            className="rounded-lg bg-error px-4 py-3 text-white"
          >
            {pending ? "Revoking…" : "Confirm revoke"}
          </button>
        </div>
      </dialog>
    </section>
  );
}
