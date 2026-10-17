"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
export function RefreshRsvps() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="rounded-lg border border-outline-variant px-4 py-3 text-sm"
    >
      {pending ? "Refreshing…" : "Refresh responses"}
    </button>
  );
}
