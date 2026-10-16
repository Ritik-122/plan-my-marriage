"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function DeleteEvent({
  weddingId,
  eventId,
  name,
}: {
  weddingId: string;
  eventId: string;
  name: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/v1/weddings/${weddingId}/events/${eventId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const result = await response.json();
        setError(result.error?.message ?? "Could not delete this event.");
        setPending(false);
        return;
      }
      dialog.current?.close();
      router.push(`/app/weddings/${weddingId}/events`);
      router.refresh();
    } catch {
      setError(
        "Could not confirm deletion. Check the schedule before retrying.",
      );
      setPending(false);
    }
  }
  return (
    <>
      <button
        className="rounded-lg border border-outline-variant px-4 py-3 text-label-lg text-error"
        onClick={() => dialog.current?.showModal()}
      >
        Delete event
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="delete-event-title"
        onCancel={(e) => {
          if (pending) e.preventDefault();
        }}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-7 shadow-xl backdrop:bg-black/40"
      >
        <h2
          id="delete-event-title"
          className="font-headline-md text-headline-md text-primary"
        >
          Delete this event?
        </h2>
        <p className="mt-4 break-words text-body-md">
          “{name}” will be permanently removed from your schedule. This cannot
          be undone.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-error">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-4">
          <button
            autoFocus
            disabled={pending}
            onClick={() => dialog.current?.close()}
            className="rounded-lg border border-outline-variant px-4 py-3"
          >
            Keep event
          </button>
          <button
            disabled={pending}
            onClick={remove}
            className="rounded-lg bg-error px-4 py-3 text-white disabled:opacity-50"
          >
            {pending ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </dialog>
    </>
  );
}
