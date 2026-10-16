"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function DeleteGuest({
  weddingId,
  guestId,
  name,
}: {
  weddingId: string;
  guestId: string;
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
        `/api/v1/weddings/${weddingId}/guests/${guestId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const result = await response.json();
        setError(result.error?.message ?? "Could not remove this guest.");
        setPending(false);
        return;
      }
      dialog.current?.close();
      router.push(`/app/weddings/${weddingId}/guests`);
      router.refresh();
    } catch {
      setError(
        "Could not confirm removal. Check the guest list before retrying.",
      );
      setPending(false);
    }
  }
  return (
    <>
      <button
        onClick={() => dialog.current?.showModal()}
        className="rounded-lg border border-outline-variant px-4 py-3 text-label-lg text-error"
      >
        Remove guest
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="remove-guest-title"
        onCancel={(e) => {
          if (pending) e.preventDefault();
        }}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-7 shadow-xl backdrop:bg-black/40"
      >
        <h2
          id="remove-guest-title"
          className="font-headline-md text-headline-md text-primary"
        >
          Remove this guest?
        </h2>
        <p className="mt-4 break-words text-body-md">
          “{name}” and their event assignments will be removed. Any associated
          RSVP responses are deleted and invitation access is revoked. This
          cannot be undone.
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
            Keep guest
          </button>
          <button
            onClick={remove}
            disabled={pending}
            className="rounded-lg bg-error px-4 py-3 text-white disabled:opacity-50"
          >
            {pending ? "Removing…" : "Remove permanently"}
          </button>
        </div>
      </dialog>
    </>
  );
}
