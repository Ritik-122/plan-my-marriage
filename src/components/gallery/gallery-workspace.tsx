"use client";
import { useEffect, useRef, useState } from "react";
import type { PhotoDTO } from "@/modules/gallery/dto";
import type { EventDTO } from "@/modules/events/dto";
import { eventButton } from "@/components/events/event-shell";
import { UploadPhotos } from "./upload-photos";
import { PhotoViewer } from "./photo-viewer";
import { GalleryImage } from "./gallery-image";
import { fileSize, galleryApi, secondary } from "./presentation";
type Summary = {
  count: number;
  sizeBytes: number;
  byEvent: { eventId: string | null; count: number }[];
};
export function GalleryWorkspace({
  weddingId,
  storageReady,
  maxBytes,
}: {
  weddingId: string;
  storageReady: boolean;
  maxBytes: number;
}) {
  const base = `/api/v1/weddings/${weddingId}`;
  const [photos, setPhotos] = useState<PhotoDTO[]>([]);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [upload, setUpload] = useState(false);
  const [viewer, setViewer] = useState<{
    photos: PhotoDTO[];
    selected: number;
  } | null>(null);
  const [revision, setRevision] = useState(0);
  const version = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const current = ++version.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const [list, totals, ceremonies] = await Promise.all([
          galleryApi<PhotoDTO[]>(
            `${base}/photos?${new URLSearchParams(filter ? { eventId: filter } : {})}`,
            { signal: controller.signal },
          ),
          galleryApi<Summary>(`${base}/photos/summary`, {
            signal: controller.signal,
          }),
          galleryApi<EventDTO[]>(`${base}/events`, {
            signal: controller.signal,
          }),
        ]);
        if (current !== version.current) return;
        setPhotos(list.data);
        setCursor(list.meta.nextCursor ?? null);
        setSummary(totals.data);
        setEvents(ceremonies.data);
      } catch (error) {
        if (!controller.signal.aborted && current === version.current)
          setError(
            error instanceof Error
              ? error.message
              : "Could not load the gallery.",
          );
      } finally {
        if (!controller.signal.aborted && current === version.current)
          setLoading(false);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [base, filter, revision]);
  async function more() {
    if (!cursor || busy) return;
    const current = version.current;
    setBusy(true);
    setError("");
    try {
      const query = new URLSearchParams({
        cursor,
        ...(filter ? { eventId: filter } : {}),
      });
      const result = await galleryApi<PhotoDTO[]>(`${base}/photos?${query}`);
      if (current === version.current) {
        setPhotos((rows) => [
          ...rows,
          ...result.data.filter(
            (row) => !rows.some((existing) => existing.id === row.id),
          ),
        ]);
        setCursor(result.meta.nextCursor ?? null);
      }
    } catch (error) {
      if (current === version.current)
        setError(
          error instanceof Error
            ? error.message
            : "Could not load more photos.",
        );
    } finally {
      setBusy(false);
    }
  }
  function choose(value: string) {
    setFilter(value);
    setLoading(true);
    setNotice("");
  }
  const counts = (id: string | null) =>
    summary?.byEvent.find((group) => group.eventId === id)?.count ?? 0;
  const filters = [
    { id: "", name: "All photos", count: summary?.count ?? 0 },
    { id: "general", name: "Wedding moments", count: counts(null) },
    ...events.map((event) => ({
      id: event.id,
      name: event.name,
      count: counts(event.id),
    })),
  ];
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-secondary">
            Your story, in pictures
          </p>
          <h1 className="mt-2 font-headline-md text-primary text-4xl md:text-5xl">
            Wedding gallery
          </h1>
          <p className="mt-3 max-w-xl text-on-surface-variant">
            From the little moments to the grand celebrations. Keep your
            favourite memories together.
          </p>
        </div>
        <button
          type="button"
          disabled={!storageReady || loading || !!error}
          onClick={() => setUpload(true)}
          className={eventButton}
        >
          ＋ Upload photos
        </button>
      </header>
      {!storageReady && (
        <div
          role="status"
          className="mt-6 rounded-xl border border-outline-variant bg-white p-5"
        >
          <h2 className="text-label-lg">Photo storage needs setup</h2>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            Your gallery is ready for its first photos. Configure Cloudflare R2
            and the media URL, then restart the application to enable uploads.
          </p>
        </div>
      )}
      <section
        aria-label="Gallery summary"
        className="mt-8 flex flex-wrap items-center gap-6 rounded-2xl border border-outline-variant/30 bg-white p-5 sm:p-6"
      >
        <div>
          <p className="font-headline-md text-primary text-3xl">
            {summary?.count ?? "—"}
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Photos collected
          </p>
        </div>
        <div className="border-l border-outline-variant/40 pl-6">
          <p className="font-headline-md text-primary text-3xl">
            {summary
              ? summary.byEvent.filter((group) => group.eventId).length
              : "—"}
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Celebrations captured
          </p>
        </div>
        <p className="text-body-sm text-on-surface-variant sm:ml-auto">
          {summary
            ? summary.sizeBytes
              ? `${fileSize(summary.sizeBytes)} of memories`
              : "Your story starts here"
            : "Loading your memories…"}
        </p>
      </section>
      <div
        aria-label="Filter photos by celebration"
        className="mt-7 flex flex-wrap gap-2"
      >
        {filters.map((item) => (
          <button
            type="button"
            key={item.id}
            disabled={busy}
            aria-pressed={filter === item.id}
            onClick={() => choose(item.id)}
            className={`max-w-full break-words rounded-full border px-4 py-2 text-body-sm ${filter === item.id ? "border-primary-container bg-primary-container text-white" : "border-outline-variant/50 bg-white hover:bg-surface-container-low"}`}
          >
            {item.name} <span className="ml-1 opacity-70">{item.count}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <p role="status" className="text-body-sm text-on-surface-variant">
          {notice ||
            (loading
              ? "Loading photos…"
              : `${photos.length} photos shown · Newest first`)}
        </p>
        <button
          type="button"
          disabled={loading || busy}
          onClick={() => {
            setLoading(true);
            setRevision((value) => value + 1);
          }}
          className="rounded px-3 py-2 text-label-lg underline underline-offset-4 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl bg-error-container/40 p-4 text-error"
        >
          {error} Use Refresh to try again.
        </div>
      )}
      {loading ? (
        <div
          className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3"
          aria-hidden="true"
        >
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-56 animate-pulse rounded-xl bg-surface-container-low"
            />
          ))}
        </div>
      ) : !error && photos.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center">
          <span
            aria-hidden="true"
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary-fixed/40 text-3xl text-secondary"
          >
            ✧
          </span>
          <h2 className="mt-5 font-headline-md text-primary text-3xl">
            {filter
              ? "This celebration is waiting for its photos"
              : "Every picture tells a part of your story"}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-on-surface-variant">
            Upload your first photos and bring these memories together in one
            place.
          </p>
          <button
            type="button"
            disabled={!storageReady}
            onClick={() => setUpload(true)}
            className={`${eventButton} mt-6`}
          >
            Upload your first photos
          </button>
        </div>
      ) : (
        <div className="mt-5 columns-1 gap-4 min-[480px]:columns-2 xl:columns-3">
          {photos.map((photo, index) => (
            <button
              type="button"
              key={photo.id}
              onClick={() => setViewer({ photos, selected: index })}
              aria-label={`View ${photo.originalFileName}`}
              className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl bg-surface-container-low text-left shadow-sm focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <GalleryImage
                url={photo.url}
                name={photo.originalFileName}
                className="max-h-[32rem] min-h-52 w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-4 pt-16 text-white">
                <p className="text-xs uppercase tracking-wider">
                  {events.find((event) => event.id === photo.eventId)?.name ??
                    "Wedding moments"}
                </p>
                <p className="mt-1 truncate text-label-lg">
                  {photo.originalFileName}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
      {!loading && cursor && (
        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={busy}
            onClick={() => void more()}
            className={secondary}
          >
            {busy ? "Loading…" : "Load more photos"}
          </button>
        </div>
      )}
      <p className="mt-10 border-t border-outline-variant/30 pt-5 text-body-sm text-on-surface-variant">
        Admins and Managers can upload and delete photos. Photo links are
        publicly viewable; event visibility does not restrict them. Guest
        uploads are coming in a later step.
      </p>
      {upload && (
        <UploadPhotos
          base={base}
          events={events}
          initialEvent={filter}
          maxBytes={maxBytes}
          onClose={() => {
            setUpload(false);
            setRevision((value) => value + 1);
          }}
          onSaved={() => setRevision((value) => value + 1)}
        />
      )}
      {viewer && (
        <PhotoViewer
          {...viewer}
          events={events}
          weddingId={weddingId}
          onClose={() => setViewer(null)}
          onDeleted={() => {
            setViewer(null);
            setNotice("Photo deleted.");
            setLoading(true);
            setRevision((value) => value + 1);
          }}
        />
      )}
    </>
  );
}
