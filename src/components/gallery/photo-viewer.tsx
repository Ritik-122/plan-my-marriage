"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PhotoDTO } from "@/modules/gallery/dto";
import type { EventDTO } from "@/modules/events/dto";
import { GalleryImage } from "./gallery-image";
import { galleryApi, GalleryError, fileSize, secondary } from "./presentation";
export function PhotoViewer({
  photos,
  selected,
  events,
  weddingId,
  onClose,
  onDeleted,
}: {
  photos: PhotoDTO[];
  selected: number;
  events: EventDTO[];
  weddingId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(selected);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const photo = photos[index];
  const event = events.find((event) => event.id === photo.eventId);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function remove() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      try {
        await galleryApi(`/api/v1/weddings/${weddingId}/photos/${photo.id}`, {
          method: "DELETE",
        });
      } catch (error) {
        if (!(error instanceof GalleryError && error.status === 404))
          throw error;
      }
      onDeleted();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not delete the photo. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  function move(direction: number) {
    setIndex((current) => current + direction);
    setConfirm(false);
    setError("");
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="viewer-heading"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else if (confirm) {
          event.preventDefault();
          setConfirm(false);
        } else onClose();
      }}
      className="m-auto max-h-[94dvh] w-[calc(100%-1rem)] max-w-6xl overflow-y-auto rounded-2xl bg-white p-0 text-on-surface shadow-xl backdrop:bg-black/80"
    >
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant/30 px-5 py-3">
        <h2
          id="viewer-heading"
          className="font-headline-md text-primary text-xl"
        >
          Your wedding memories
        </h2>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className={secondary}
          aria-label="Close photo viewer"
        >
          Close ×
        </button>
      </div>
      <div className="grid md:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col bg-[#201b1c]">
          <div className="flex min-h-64 flex-1 items-center justify-center p-3 sm:p-6">
            <GalleryImage
              key={photo.id}
              url={photo.url}
              name={photo.originalFileName}
              className="max-h-[65dvh] max-w-full object-contain"
            />
          </div>
          <div className="flex items-center justify-between gap-3 p-4 text-white">
            <button
              type="button"
              disabled={index === 0 || busy || confirm}
              onClick={() => move(-1)}
              className="rounded-lg border border-white/30 px-3 py-2 disabled:opacity-30"
              aria-label="Previous photo"
            >
              ←
            </button>
            <p className="text-body-sm">
              {index + 1} of {photos.length} loaded photos
            </p>
            <button
              type="button"
              disabled={index === photos.length - 1 || busy || confirm}
              onClick={() => move(1)}
              className="rounded-lg border border-white/30 px-3 py-2 disabled:opacity-30"
              aria-label="Next photo"
            >
              →
            </button>
          </div>
        </div>
        <aside className="min-w-0 p-5 sm:p-7">
          <p className="text-xs uppercase tracking-widest text-secondary">
            The celebration
          </p>
          <h3 className="mt-3 break-words font-headline-md text-primary text-3xl">
            {event?.name ?? "Wedding moments"}
          </h3>
          {event ? (
            <>
              <p className="mt-3 text-body-sm">
                {new Date(event.startsAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Asia/Kolkata",
                })}
              </p>
              <p className="mt-1 break-words text-body-sm text-on-surface-variant">
                {event.venue.name}
              </p>
              <Link
                href={`/app/weddings/${weddingId}/events/${event.id}`}
                className="mt-3 inline-block text-label-lg underline underline-offset-4"
              >
                View event
              </Link>
            </>
          ) : (
            <p className="mt-3 text-body-sm text-on-surface-variant">
              General wedding photos
            </p>
          )}
          <dl className="mt-7 space-y-4 border-t border-outline-variant/40 pt-5 text-body-sm">
            <div>
              <dt className="text-on-surface-variant">File name</dt>
              <dd className="mt-1 break-all">{photo.originalFileName}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">File details</dt>
              <dd className="mt-1">
                {photo.mimeType.replace("image/", "").toUpperCase()} ·{" "}
                {fileSize(photo.sizeBytes)}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Uploaded</dt>
              <dd className="mt-1">
                {new Date(photo.createdAt).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                IST
                <br />
                By{" "}
                {photo.uploadedByType === "ADMIN"
                  ? "an Admin"
                  : photo.uploadedByType === "MANAGER"
                    ? "a Manager"
                    : "a guest"}
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-xs text-on-surface-variant">
            Anyone with the photo URL can view it, regardless of event
            visibility or website publishing.
          </p>
          {confirm ? (
            <div className="mt-6 rounded-xl bg-error-container/40 p-4">
              <h4 className="text-label-lg">Delete this photo?</h4>
              <p className="mt-2 text-body-sm">
                This removes it from the gallery and storage. It cannot be
                undone. Previously downloaded copies remain.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirm(false)}
                  className={secondary}
                >
                  Keep photo
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void remove()}
                  className="rounded-lg bg-error px-4 py-3 text-label-lg text-white disabled:opacity-50"
                >
                  {busy ? "Deleting…" : "Delete permanently"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              className="mt-7 rounded-lg border border-error/30 px-4 py-3 text-label-lg text-error"
            >
              Delete photo
            </button>
          )}
          {error && (
            <p role="alert" className="mt-4 text-body-sm text-error">
              {error}
            </p>
          )}
        </aside>
      </div>
    </dialog>
  );
}
