"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Brand } from "@/components/brand";
import {
  createWeddingSchema,
  dateInputToISO,
  formatWeddingDate,
  suggestSlug,
  themes,
  themeNames,
} from "@/modules/weddings/schema";
import type { WeddingDTO } from "@/modules/weddings/dto";
import {
  WeddingDetailsFields,
  emptyWedding,
  type WeddingForm,
} from "./wedding-details-fields";
import { ThemePreview } from "./theme-preview";

const buttonClass =
  "rounded-lg bg-primary-container px-6 py-3 text-label-lg text-white shadow-sm hover:bg-primary disabled:cursor-wait disabled:opacity-60";
const descriptions = {
  CLASSIC_INDIAN:
    "Warm ivory, terracotta accents, and timeless architectural arches.",
  MODERN_MINIMAL:
    "Clean typography, monochrome contrasts, and a little room to breathe.",
  ROYAL_INDIAN:
    "Deep burgundy, champagne borders, and a regal ceremonial feel.",
};
const storedSchema = z.object({
  form: z.object({
    brideName: z.string().max(100),
    groomName: z.string().max(100),
    weddingDate: z.string().max(10),
    city: z.string().max(200),
    description: z.string().max(1000),
    slug: z.string().max(80),
    theme: z.enum(themes),
  }),
  savedAt: z.number(),
  customSlug: z.boolean(),
});

export function WeddingWizard({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  const router = useRouter();
  const key = `pmm:wedding-draft:v1:${userId}`;
  const [form, setForm] = useState<WeddingForm>(emptyWedding);
  const [step, setStep] = useState(1);
  const [ready, setReady] = useState(false);
  const [customSlug, setCustomSlug] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [created, setCreated] = useState<WeddingDTO | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    // Browser-only drafts must be restored after server hydration.
    try {
      const raw = localStorage.getItem(key);
      if (raw && raw.length < 12000) {
        const draft = storedSchema.safeParse(JSON.parse(raw));
        if (draft.success && Date.now() - draft.data.savedAt < 7 * 86400000) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore a validated browser-only draft after hydration.
          setForm(draft.data.form);
          setCustomSlug(draft.data.customSlug);
        }
      }
    } catch {
      /* Storage can be disabled; the form still works in memory. */
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready || created) return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ form, customSlug, savedAt: Date.now() }),
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reflect whether the browser storage write succeeded.
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [form, customSlug, ready, created, key]);
  function change(name: keyof WeddingForm, value: string) {
    setForm((old) => {
      const next = { ...old, [name]: value };
      if ((name === "brideName" || name === "groomName") && !customSlug)
        next.slug = suggestSlug(next.brideName, next.groomName);
      return next;
    });
    if (name === "slug") setCustomSlug(true);
    setErrors((old) => ({ ...old, [name]: "" }));
    setError("");
  }
  function validate() {
    const parsed = createWeddingSchema.safeParse({
      ...form,
      weddingDate: dateInputToISO(form.weddingDate),
    });
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fields[String(issue.path[0])] ??=
          issue.path[0] === "weddingDate"
            ? "Choose a valid wedding date."
            : issue.message;
      });
      setErrors(fields);
      setError("Please check your wedding details.");
      return null;
    }
    setErrors({});
    setError("");
    return parsed.data;
  }
  function go(next: number) {
    if (pending) return;
    if (next > 1 && !validate()) {
      setStep(1);
      return;
    }
    setStep(next);
    requestAnimationFrame(() => {
      title.current?.focus();
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }
  function saveAndExit() {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ form, customSlug, savedAt: Date.now() }),
      );
      router.push("/app");
    } catch {
      setError(
        "Your browser couldn’t save this draft. Keep this tab open to continue, or use Discard draft to leave.",
      );
    }
  }
  async function create() {
    const input = validate();
    if (!input) {
      setStep(1);
      return;
    }
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/v1/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(
          response.status === 401
            ? "Your session has expired. Sign in again, then resume this draft."
            : result.error?.message ||
                "Could not create your wedding. Please try again.",
        );
        setErrors(result.error?.fields || {});
        if (response.status === 409) setStep(1);
        return;
      }
      setCreated(result.data);
      try {
        localStorage.removeItem(key);
      } catch {
        /* Creation succeeded even if draft removal is unavailable. */
      }
      router.refresh();
      requestAnimationFrame(() => title.current?.focus());
    } catch {
      setError(
        "We couldn’t confirm whether your wedding was created. Check Your weddings before trying again.",
      );
    } finally {
      setPending(false);
    }
  }
  const date = dateInputToISO(form.weddingDate);
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-outline-variant/20 bg-surface/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-margin py-5">
          <Brand />
          <div className="flex items-center gap-5">
            <span className="hidden max-w-40 truncate text-label-lg sm:block">
              {displayName}
            </span>
            {!created && (
              <button
                type="button"
                onClick={saveAndExit}
                disabled={pending || !ready}
                className="text-label-lg text-primary disabled:opacity-50"
              >
                Save &amp; Exit
              </button>
            )}
          </div>
        </div>
      </header>
      <main
        className={`mx-auto px-margin py-10 ${step === 2 && !created ? "max-w-7xl" : "max-w-4xl"}`}
      >
        {!created && (
          <>
            <ol
              aria-label="Wedding setup progress"
              className="mx-auto mb-10 grid max-w-2xl grid-cols-3 gap-2"
            >
              {["Wedding Details", "Choose Your Style", "Review & Create"].map(
                (label, i) => (
                  <li
                    key={label}
                    aria-current={step === i + 1 ? "step" : undefined}
                    className={`flex flex-col items-center gap-2 text-center text-label-md ${step === i + 1 ? "text-primary" : "text-on-surface-variant"}`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= i + 1 ? "bg-primary-container text-white" : "bg-surface-container"}`}
                    >
                      {i + 1}
                    </span>
                    <span>{label}</span>
                  </li>
                ),
              )}
            </ol>
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <p className="mb-3 text-label-md uppercase tracking-widest text-secondary">
                Step {step} of 3
              </p>
              <h1
                ref={title}
                tabIndex={-1}
                className="font-display-sm text-display-sm-mobile text-primary outline-none md:text-display-sm"
              >
                {step === 1
                  ? "Let’s start with your wedding."
                  : step === 2
                    ? "Choose how your wedding feels."
                    : "Make sure it feels like you."}
              </h1>
              <p className="mt-3 text-body-md text-on-surface-variant">
                {step === 1
                  ? "Just the essentials for now. You can refine your details later."
                  : step === 2
                    ? "Choose a style for your guest website and invitations. Your planning workspace stays the same."
                    : "Review your details before we create your private wedding workspace."}
              </p>
              <p className="mt-3 text-body-sm text-outline">
                {ready
                  ? saved
                    ? "Draft saved on this device · Kept for 7 days"
                    : "Draft stays in this tab while browser storage is unavailable"
                  : "Loading your draft…"}
              </p>
            </div>
          </>
        )}
        {error && (
          <div
            role="alert"
            className="mx-auto mb-6 max-w-2xl rounded-lg bg-error-container/40 p-4 text-body-md text-on-error-container"
          >
            <p>{error}</p>
            <div className="mt-2 flex gap-4">
              <Link href="/sign-in" className="underline">
                Sign in
              </Link>
              <Link href="/app" className="underline">
                Your weddings
              </Link>
            </div>
          </div>
        )}
        {!created && step === 1 && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              go(2);
            }}
            className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm sm:p-10"
          >
            <WeddingDetailsFields
              form={form}
              onChange={change}
              errors={errors}
              disabled={!ready || pending}
            />
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={saveAndExit}
                disabled={!ready || pending}
                className="text-label-lg text-on-surface-variant"
              >
                I’ll finish this later
              </button>
              <button disabled={!ready || pending} className={buttonClass}>
                Continue to Style →
              </button>
            </div>
          </form>
        )}
        {!created && step === 2 && (
          <>
            <fieldset>
              <legend className="sr-only">Wedding theme</legend>
              <div className="grid gap-6 lg:grid-cols-3">
                {themes.map((theme) => (
                  <label
                    key={theme}
                    className={`relative flex cursor-pointer flex-col rounded-xl border-2 bg-white p-5 shadow-sm focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-secondary ${form.theme === theme ? "border-primary" : "border-transparent"}`}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="font-headline-md text-headline-md text-primary">
                        {themeNames[theme]}
                      </span>
                      <input
                        type="radio"
                        name="theme"
                        value={theme}
                        checked={form.theme === theme}
                        onChange={() => change("theme", theme)}
                        className="h-5 w-5 accent-primary"
                      />
                    </div>
                    <p className="mb-5 min-h-16 text-body-md text-on-surface-variant">
                      {descriptions[theme]}
                    </p>
                    <ThemePreview
                      theme={theme}
                      brideName={form.brideName}
                      groomName={form.groomName}
                      date={date}
                      city={form.city}
                    />
                    <span className="mt-5 text-center text-label-lg text-primary">
                      {form.theme === theme ? "Selected" : "Select this theme"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-8 rounded-xl bg-surface-container-low p-5 text-body-md text-on-surface-variant">
              You can change your theme later without changing your wedding
              details. You can preview and publish your guest website after
              creating your wedding.
            </div>
            <div className="mt-8 flex flex-wrap justify-between gap-4">
              <button
                onClick={() => go(1)}
                className="text-label-lg text-primary"
              >
                ← Back to Details
              </button>
              <button onClick={() => go(3)} className={buttonClass}>
                Continue to Review →
              </button>
            </div>
          </>
        )}
        {!created && step === 3 && (
          <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm sm:p-10">
            <h2 className="break-words text-center font-display-sm text-display-sm-mobile text-primary">
              {form.brideName} &amp; {form.groomName}
            </h2>
            <p className="mt-3 break-words text-center text-body-md text-on-surface-variant">
              {formatWeddingDate(date)} · {form.city}
            </p>
            <div className="my-8 space-y-6 divide-y divide-outline-variant/30">
              <ReviewRow title="Couple & wedding details" edit={() => go(1)}>
                <p className="break-words">
                  Bride: {form.brideName} · Groom: {form.groomName}
                </p>
                <p>{formatWeddingDate(date)} · India Standard Time</p>
                <p className="break-words">{form.city}</p>
                {form.description && (
                  <p className="mt-2 whitespace-pre-wrap break-words">
                    {form.description}
                  </p>
                )}
              </ReviewRow>
              <ReviewRow title="Selected theme" edit={() => go(2)}>
                <p>{themeNames[form.theme]}</p>
                <p className="mt-1 text-body-sm">{descriptions[form.theme]}</p>
              </ReviewRow>
              <ReviewRow title="Wedding website handle" edit={() => go(1)}>
                <p className="break-all font-semibold text-primary">
                  /w/{form.slug}
                </p>
                <p className="mt-2 text-body-sm">
                  Availability is checked when you create. Your website stays
                  unpublished.
                </p>
              </ReviewRow>
            </div>
            <button
              onClick={create}
              disabled={pending}
              className={`${buttonClass} w-full`}
            >
              {pending
                ? "Creating your wedding…"
                : "Create Our Wedding Workspace →"}
            </button>
            <button
              onClick={() => go(2)}
              disabled={pending}
              className="mt-4 w-full py-2 text-label-lg text-primary"
            >
              ← Back to Style
            </button>
          </div>
        )}
        {created && (
          <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm sm:p-12">
            <span
              aria-hidden="true"
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-tertiary-fixed text-2xl text-tertiary"
            >
              ✓
            </span>
            <h1
              ref={title}
              tabIndex={-1}
              className="font-display-sm text-display-sm-mobile text-primary outline-none"
            >
              Your wedding workspace is ready.
            </h1>
            <p className="mt-5 break-words text-title-lg">
              {created.brideName} &amp; {created.groomName}
            </p>
            <p className="mt-2 text-body-md text-on-surface-variant">
              {formatWeddingDate(created.weddingDate)} ·{" "}
              {themeNames[created.theme]}
            </p>
            <p className="my-6 text-body-md text-on-surface-variant">
              You’re its first Admin. Your wedding details are saved, and your
              guest website is unpublished.
            </p>
            <Link
              href={`/app/weddings/${created.id}`}
              className={`${buttonClass} inline-block`}
            >
              Open Wedding Dashboard →
            </Link>
          </div>
        )}
        {!created && (
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-between gap-4 text-body-sm text-on-surface-variant">
            <span>Private by default · Built for Indian weddings</span>
            <button
              disabled={pending}
              className="underline"
              onClick={() => {
                if (window.confirm("Discard this device’s wedding draft?")) {
                  try {
                    localStorage.removeItem(key);
                  } catch {}
                  setCreated(null);
                  router.push("/app");
                }
              }}
            >
              Discard draft
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
function ReviewRow({
  title,
  edit,
  children,
}: {
  title: string;
  edit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-title-md text-primary">{title}</h3>
        <button onClick={edit} className="text-label-lg text-secondary">
          Edit {title.toLowerCase()}
        </button>
      </div>
      <div className="text-body-md text-on-surface-variant">{children}</div>
    </section>
  );
}
