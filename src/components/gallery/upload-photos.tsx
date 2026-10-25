"use client";
import { useEffect, useRef, useState } from "react";
import type { EventDTO } from "@/modules/events/dto";
import type { PhotoDTO } from "@/modules/gallery/dto";
import type { FinalizeInput } from "@/modules/gallery/schema";
import { imageTypes } from "@/modules/gallery/schema";
import { eventButton } from "@/components/events/event-shell";
import {
  fileSize,
  GalleryError,
  galleryApi,
  post,
  secondary,
} from "./presentation";
type Intent = {
  objectKey: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
};
type Row = {
  id: string;
  file: File;
  status: "queued" | "uploading" | "saving" | "saved" | "failed";
  progress: number;
  error?: string;
  finalize?: FinalizeInput;
};
function putFile(
  intent: Intent,
  file: File,
  progress: (percent: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", intent.uploadUrl);
    xhr.timeout = 120000;
    for (const [key, value] of Object.entries(intent.requiredHeaders))
      xhr.setRequestHeader(key, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        progress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(
            new Error(
              "Upload could not be confirmed. Retry to check and finish this photo.",
            ),
          );
    xhr.onerror = xhr.ontimeout = () =>
      reject(
        new Error(
          "Connection interrupted. Retry to check and finish this photo.",
        ),
      );
    xhr.send(file);
  });
}
export function UploadPhotos({
  base,
  events,
  initialEvent,
  maxBytes,
  onClose,
  onSaved,
}: {
  base: string;
  events: EventDTO[];
  initialEvent: string;
  maxBytes: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [eventId, setEventId] = useState(
    initialEvent === "general" ? "" : initialEvent,
  );
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const running = useRef(false);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);
  function add(files: FileList | File[]) {
    if (running.current) return;
    const available = 20 - rows.length;
    const selected = Array.from(files);
    const accepted = selected.filter(
      (file) =>
        imageTypes.includes(file.type as (typeof imageTypes)[number]) &&
        file.size > 0 &&
        file.size <= maxBytes &&
        file.name.length <= 255 &&
        !/[\x00-\x1f\x7f]/.test(file.name),
    );
    setMessage(
      accepted.length !== selected.length
        ? `Some files were skipped. Choose JPEG, PNG or WebP images up to ${fileSize(maxBytes)} with a short file name.`
        : accepted.length > available
          ? "Choose up to 20 photos per batch. Extra files were skipped."
          : "",
    );
    setRows((current) => [
      ...current,
      ...accepted.slice(0, available).map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "queued" as const,
        progress: 0,
      })),
    ]);
  }
  function update(id: string, changes: Partial<Row>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );
  }
  async function upload(targets: Row[]) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setMessage("");
    let saved = false;
    for (const row of targets) {
      try {
        // A response may have been lost after the server saved the photo. Check the same intent first.
        if (row.finalize) {
          update(row.id, { status: "saving", error: undefined });
          try {
            await galleryApi<{ photo: PhotoDTO }>(
              `${base}/uploads/finalize`,
              post(row.finalize),
            );
            update(row.id, { status: "saved", progress: 100 });
            saved = true;
            continue;
          } catch (error) {
            if (!(
              error instanceof GalleryError && error.code === "UPLOAD_NOT_FOUND"
            ))
              throw error;
          }
        }
        update(row.id, { status: "uploading", progress: 0, error: undefined });
        const scope = {
          purpose: eventId
            ? ("EVENT_GALLERY" as const)
            : ("WEDDING_GALLERY" as const),
          eventId: eventId || null,
        };
        const { data: intent } = await galleryApi<Intent>(
          `${base}/uploads/presign`,
          post({
            ...scope,
            fileName: row.file.name.trim(),
            mimeType: row.file.type,
            sizeBytes: row.file.size,
          }),
        );
        const finalize = {
          ...scope,
          objectKey: intent.objectKey,
          originalFileName: row.file.name.trim(),
        };
        update(row.id, { finalize });
        await putFile(intent, row.file, (progress) =>
          update(row.id, { progress }),
        );
        update(row.id, { status: "saving" });
        await galleryApi<{ photo: PhotoDTO }>(
          `${base}/uploads/finalize`,
          post(finalize),
        );
        update(row.id, { status: "saved", progress: 100 });
        saved = true;
      } catch (error) {
        update(row.id, {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Upload failed. Please retry.",
        });
      }
    }
    running.current = false;
    setBusy(false);
    if (saved) onSaved();
  }
  const pending = rows.filter((row) => row.status === "queued");
  const locked = rows.some((row) => row.status !== "queued");
  return (
    <dialog
      ref={dialog}
      aria-labelledby="upload-heading"
      onCancel={(event) => {
        if (running.current) event.preventDefault();
        else onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border-t-4 border-primary-container bg-white p-0 text-on-surface shadow-xl backdrop:bg-black/50"
    >
      <div className="p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-secondary">
              Your shared memories
            </p>
            <h2
              id="upload-heading"
              className="mt-2 font-headline-md text-primary text-3xl"
            >
              Upload photos
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close upload"
            disabled={busy}
            onClick={onClose}
            className={secondary}
          >
            ×
          </button>
        </div>
        <p className="mt-3 text-on-surface-variant">
          Add your favourite moments to the wedding gallery.
        </p>
        <label className="mt-6 block text-label-lg" htmlFor="photo-event">
          Celebration
        </label>
        <select
          id="photo-event"
          value={eventId}
          disabled={busy || locked}
          onChange={(e) => setEventId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-container-low p-3"
        >
          <option value="">General wedding photos</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          The selected celebration applies to this batch.
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            add(e.dataTransfer.files);
          }}
          className={`mt-6 rounded-xl border-2 border-dashed p-7 text-center ${dragging ? "border-primary bg-secondary-fixed/30" : "border-outline-variant bg-surface-container-low/50"}`}
        >
          <p className="font-headline-md text-primary text-2xl">
            A moment worth keeping
          </p>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            Drop photos here or choose them from your device.
          </p>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            aria-label="Choose photos"
            disabled={busy || rows.length >= 20}
            onChange={(e) => {
              if (e.target.files) add(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy || rows.length >= 20}
            onClick={() => input.current?.click()}
            className={`${secondary} mt-4`}
          >
            Browse files
          </button>
          <p className="mt-3 text-xs text-on-surface-variant">
            JPEG, PNG or WebP · Up to {fileSize(maxBytes)} each · 20 per batch
          </p>
        </div>
        {message && (
          <p role="alert" className="mt-4 text-error">
            {message}
          </p>
        )}
        {rows.length > 0 && (
          <ul aria-label="Upload queue" className="mt-5 space-y-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-outline-variant/50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all text-label-lg">{row.file.name}</p>
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      {fileSize(row.file.size)} ·{" "}
                      {row.status === "saved"
                        ? "Saved to gallery"
                        : row.status === "saving"
                          ? "Verifying and saving…"
                          : row.status === "uploading"
                            ? `Uploading ${row.progress}%`
                            : row.status === "failed"
                              ? "Needs attention"
                              : "Ready to upload"}
                    </p>
                  </div>
                  {row.status === "queued" && (
                    <button
                      type="button"
                      disabled={busy}
                      aria-label={`Remove ${row.file.name}`}
                      onClick={() =>
                        setRows((current) =>
                          current.filter((item) => item.id !== row.id),
                        )
                      }
                      className="p-2"
                    >
                      ×
                    </button>
                  )}
                  {row.status === "failed" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void upload([row])}
                      className={secondary}
                    >
                      Retry
                    </button>
                  )}
                </div>
                {row.status === "uploading" && (
                  <progress
                    aria-label={`Uploading ${row.file.name}`}
                    value={row.progress}
                    max={100}
                    className="mt-2 w-full accent-primary-container"
                  />
                )}
                {row.error && (
                  <p role="alert" className="mt-2 text-body-sm text-error">
                    {row.error}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 text-body-sm text-on-surface-variant">
          Photo URLs can be viewed by anyone with the link. Upload only photos
          you are happy to share. These photos are not automatically added to
          your guest website.
        </p>
      </div>
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 bg-white p-5 sm:px-8">
        <p role="status" className="text-body-sm">
          {rows.filter((row) => row.status === "saved").length} of {rows.length}{" "}
          saved{busy ? " · Keep this window open" : ""}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className={secondary}
          >
            Done
          </button>
          <button
            type="button"
            disabled={busy || !pending.length}
            onClick={() => void upload(pending)}
            className={eventButton}
          >
            {busy ? "Uploading…" : "Upload photos"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
