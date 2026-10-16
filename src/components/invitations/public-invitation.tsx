"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { InvitationDTO } from "@/modules/invitations/dto";
import { InvitationView, InvitationUnavailable } from "./invitation-view";
export function PublicInvitation() {
  const { token } = useParams<{ token: string }>();
  return <InvitationLoader key={token} token={token} />;
}
function InvitationLoader({ token }: { token: string }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    data?: InvitationDTO;
    invalid?: boolean;
    error?: string;
  }>({});
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/v1/guest/invitation", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "omit",
          cache: "no-store",
          referrerPolicy: "no-referrer",
          signal: controller.signal,
        });
        const result = await response.json();
        if (controller.signal.aborted) return;
        if (response.ok) setState({ data: result.data });
        else if (result.error?.code === "GUEST_LINK_INVALID")
          setState({ invalid: true });
        else
          setState({
            error:
              result.error?.message ??
              "We couldn’t load your invitation. Please try again.",
          });
      } catch {
        if (!controller.signal.aborted)
          setState({ error: "We couldn’t connect. Please try again." });
      }
    }
    void load();
    return () => controller.abort();
  }, [token, attempt]);
  if (state.invalid) return <InvitationUnavailable />;
  if (state.data) return <InvitationView invitation={state.data} />;
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="max-w-md rounded-xl bg-white p-8 text-center">
        <h1 className="font-headline-md text-3xl text-primary">
          Your invitation
        </h1>
        {state.error ? (
          <>
            <p role="alert" className="mt-5 text-sm leading-7">
              {state.error}
            </p>
            <button
              className="mt-6 rounded-lg bg-primary px-5 py-3 text-white"
              onClick={() => {
                setState({});
                setAttempt(attempt + 1);
              }}
            >
              Try again
            </button>
          </>
        ) : (
          <p role="status" className="mt-5">
            Opening your invitation…
          </p>
        )}
      </div>
    </main>
  );
}
