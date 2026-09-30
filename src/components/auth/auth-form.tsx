"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { loginSchema, registerSchema } from "@/modules/auth/schema";

const inputClass =
  "w-full rounded-lg border border-transparent bg-surface-container-low px-3.5 py-3 text-base text-on-surface focus:border-primary-container focus:bg-white focus:outline-2 focus:outline-primary-container disabled:opacity-60";
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const alert = useRef<HTMLParagraphElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    setFields({});
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = (registering ? registerSchema : loginSchema).safeParse(
      values,
    );
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        errors[key] ??= issue.message;
      });
      setFields(errors);
      setError("Check the highlighted fields.");
      requestAnimationFrame(() => alert.current?.focus());
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/v1/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const result = await response.json();
        setError(
          result.error?.message ?? "Unable to continue. Please try again.",
        );
        setFields(result.error?.fields ?? {});
        requestAnimationFrame(() => alert.current?.focus());
        return;
      }
      // Full navigation discards any previously cached anonymous/protected UI.
      window.location.replace("/app");
    } catch {
      setError("We couldn’t connect. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl sm:p-10">
      <h2 className="font-headline-lg text-headline-lg text-primary">
        {registering ? "Create your account" : "Sign in"}
      </h2>
      <p className="mt-2 mb-7 text-body-md text-on-surface-variant">
        {registering
          ? "A little less chaos. A little more together."
          : "Your shared wedding workspace starts here."}
      </p>
      <form
        onSubmit={submit}
        noValidate
        className="space-y-5"
        aria-busy={pending}
      >
        {error && (
          <p
            ref={alert}
            tabIndex={-1}
            role="alert"
            className="rounded-lg bg-error-container/40 p-3 text-body-md text-on-error-container"
          >
            {error}
          </p>
        )}
        {registering && (
          <div>
            <label
              htmlFor="displayName"
              className="mb-2 block text-label-md uppercase tracking-wider"
            >
              Your name
            </label>
            <input
              className={inputClass}
              id="displayName"
              name="displayName"
              autoComplete="name"
              maxLength={100}
              required
              disabled={pending}
              aria-invalid={Boolean(fields.displayName)}
              aria-describedby={fields.displayName ? "name-error" : undefined}
            />
            {fields.displayName && (
              <p id="name-error" className="mt-1 text-body-sm text-error">
                {fields.displayName}
              </p>
            )}
          </div>
        )}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-label-md uppercase tracking-wider"
          >
            Email address
          </label>
          <input
            className={inputClass}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            placeholder="you@example.com"
            required
            disabled={pending}
            aria-invalid={Boolean(fields.email)}
            aria-describedby={fields.email ? "email-error" : undefined}
          />
          {fields.email && (
            <p id="email-error" className="mt-1 text-body-sm text-error">
              {fields.email}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-label-md uppercase tracking-wider"
          >
            Password
          </label>
          <div className="relative">
            <input
              className={`${inputClass} pr-16`}
              id="password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete={registering ? "new-password" : "current-password"}
              required
              disabled={pending}
              aria-invalid={Boolean(fields.password)}
              aria-describedby={
                [
                  registering ? "password-hint" : "",
                  fields.password ? "password-error" : "",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 text-label-md text-primary"
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              onClick={() => setVisible(!visible)}
            >
              {visible ? "Hide" : "Show"}
            </button>
          </div>
          {registering && (
            <p
              id="password-hint"
              className="mt-2 text-body-sm text-on-surface-variant"
            >
              Use 12–72 characters. Emoji and accented characters may need a
              shorter password.
            </p>
          )}
          {fields.password && (
            <p id="password-error" className="mt-1 text-body-sm text-error">
              {fields.password}
            </p>
          )}
        </div>
        <button
          disabled={pending}
          className="w-full rounded-lg bg-primary-container px-6 py-3 text-title-md text-white shadow-md transition-colors hover:bg-primary disabled:cursor-wait disabled:opacity-60"
        >
          {pending
            ? registering
              ? "Creating your account…"
              : "Signing in…"
            : registering
              ? "Create account"
              : "Sign in"}
        </button>
      </form>
      <p className="my-5 rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
        You’ll stay signed in for up to 7 days. Sign out when using a shared
        device.
      </p>
      <p className="text-center text-body-sm text-on-surface-variant">
        {registering ? "Already have an account?" : "New to Plan My Marriage?"}{" "}
        <Link
          className="font-semibold text-secondary underline-offset-4 hover:underline"
          href={registering ? "/sign-in" : "/sign-up"}
        >
          {registering ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
