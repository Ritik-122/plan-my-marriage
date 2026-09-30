"use client";
import { useState } from "react";

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      window.location.replace("/sign-in");
    } catch {
      setError("Could not sign out. Please try again.");
      setPending(false);
    }
  }
  return (
    <div>
      <button
        onClick={signOut}
        disabled={pending}
        className="rounded-lg border border-outline-variant px-4 py-2 text-label-lg text-primary disabled:opacity-60"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-body-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
