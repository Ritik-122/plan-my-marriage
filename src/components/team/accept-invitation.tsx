"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { AuthForm } from "@/components/auth/auth-form";
import type { InvitationContextDTO } from "@/modules/team/dto";
export function AcceptInvitation() {
  const [context, setContext] = useState<InvitationContextDTO | null>(null);
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const load = useCallback(async () => {
    setError("");
    setInvalid(false);
    const token = window.location.hash.slice(1);
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      setInvalid(true);
      setError(
        "This invitation link is incomplete. Open the full link from your email.",
      );
      return;
    }
    try {
      const response = await fetch("/api/v1/member-invitations/context", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        setContext(null);
        setInvalid(response.status === 410);
        throw new Error(
          result.error?.message ?? "Unable to load this invitation.",
        );
      }
      setContext(result.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect. Please try again.",
      );
    }
  }, []);
  useEffect(() => {
    // The capability is a browser-only fragment; resolve its external state after mounting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, [load]);
  async function accept() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/member-invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: window.location.hash.slice(1) }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error?.message ?? "Unable to accept this invitation.",
        );
      window.location.replace(`/app/weddings/${result.data.weddingId}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect. You can safely try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      await load();
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-surface px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm sm:p-10">
          <p className="text-xs uppercase tracking-widest text-secondary">
            A celebration, made together
          </p>
          <h1 className="mt-4 font-headline-lg text-headline-lg text-primary">
            {invalid ? "Invitation unavailable" : "You’re invited to the team"}
          </h1>
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-lg bg-error-container/50 p-4 text-on-error-container"
            >
              {error}
            </p>
          )}
          {!context && !error && (
            <p className="mt-6" role="status">
              Loading your invitation…
            </p>
          )}
          {context && !invalid && (
            <>
              <div className="my-7 rounded-xl bg-surface-container-low p-6">
                <h2 className="break-words font-headline-md text-headline-md">
                  {context.brideName} &amp; {context.groomName}
                </h2>
                <p className="mt-2 break-words text-sm">{context.city}</p>
                <span className="mt-4 inline-block rounded-full bg-secondary-fixed px-4 py-2 text-sm">
                  Invited as {context.role === "ADMIN" ? "Admin" : "Manager"}
                </span>
              </div>
              <p className="text-sm leading-6">
                {context.role === "ADMIN"
                  ? "You’ll have equal Admin access to wedding planning and team management. Admins cannot be removed in this version."
                  : "Help manage the wedding’s planning information. Team administration stays with the Admins."}
              </p>
              <p className="mt-3 text-xs text-on-surface-variant">
                Expires{" "}
                {new Date(context.expiresAt).toLocaleDateString("en-IN")}
              </p>
              {context.user ? (
                <div className="mt-6">
                  <p className="break-all text-sm">
                    Signed in as {context.user.email}
                  </p>
                  {context.emailMatches ? (
                    <>
                      <p className="my-4 text-sm text-tertiary">
                        {context.accepted
                          ? "You’ve already accepted this invitation."
                          : "Your email matches this invitation."}
                      </p>
                      <button
                        className="w-full rounded-lg bg-primary-container px-6 py-3 text-white disabled:opacity-50"
                        disabled={busy}
                        onClick={() => void accept()}
                      >
                        {busy
                          ? "Opening your wedding…"
                          : context.accepted
                            ? "Open wedding"
                            : "Accept invitation"}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="my-4 text-sm text-error">
                        This invitation belongs to another email address. Sign
                        in with the account that received it.
                      </p>
                      <button
                        disabled={busy}
                        onClick={() => void signOut()}
                        className="rounded-lg border border-outline-variant px-5 py-3"
                      >
                        Sign out and switch account
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <p className="mt-6 text-sm">
                  Sign in or create an account with the invited email address
                  below.
                </p>
              )}
            </>
          )}
          {error && !invalid && (
            <button className="mt-5 underline" onClick={() => void load()}>
              Try again
            </button>
          )}
          <Link
            href="/"
            className="mt-6 block text-sm text-secondary underline"
          >
            Back to home
          </Link>
        </section>
        {context && !context.user && !invalid && (
          <div className="mt-6 flex justify-center">
            <AuthForm
              key={mode}
              mode={mode}
              onModeChange={() =>
                setMode(mode === "login" ? "register" : "login")
              }
              onAuthenticated={() => void load()}
            />
          </div>
        )}
      </div>
    </main>
  );
}
