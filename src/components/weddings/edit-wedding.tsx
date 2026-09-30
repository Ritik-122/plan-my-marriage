"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { WeddingDTO } from "@/modules/weddings/dto";
import {
  dateForInput,
  dateInputToISO,
  updateWeddingSchema,
  themes,
  themeNames,
} from "@/modules/weddings/schema";
import {
  WeddingDetailsFields,
  fieldClass,
  type WeddingForm,
} from "./wedding-details-fields";
export function EditWedding({ wedding }: { wedding: WeddingDTO }) {
  const router = useRouter();
  const [form, setForm] = useState<WeddingForm>({
    ...wedding,
    weddingDate: dateForInput(wedding.weddingDate),
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  async function save(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError("");
    const { slug, ...data } = form;
    void slug;
    const parsed = updateWeddingSchema.safeParse({
      brideName: data.brideName,
      groomName: data.groomName,
      weddingDate: dateInputToISO(data.weddingDate),
      city: data.city,
      description: data.description,
      theme: data.theme,
    });
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fields[String(issue.path[0])] = issue.message;
      });
      setErrors(fields);
      setError("Check your wedding details.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/v1/weddings/${wedding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error?.message || "Could not save your changes.");
        setErrors(result.error?.fields || {});
        return;
      }
      router.push(`/app/weddings/${wedding.id}`);
      router.refresh();
    } catch {
      setError("We couldn’t save your changes. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form
      noValidate
      onSubmit={save}
      className="rounded-xl bg-white p-6 shadow-sm sm:p-10"
    >
      {error && (
        <p
          role="alert"
          className="mb-6 rounded-lg bg-error-container/40 p-4 text-body-md text-on-error-container"
        >
          {error}
        </p>
      )}
      <WeddingDetailsFields
        form={form}
        errors={errors}
        disabled={pending}
        showSlug={false}
        onChange={(name, value) =>
          setForm((old) => ({ ...old, [name]: value }))
        }
      />
      <label htmlFor="theme" className="mt-6 mb-2 block text-label-lg">
        Wedding theme
      </label>
      <select
        id="theme"
        value={form.theme}
        disabled={pending}
        onChange={(e) =>
          setForm((old) => ({
            ...old,
            theme: e.target.value as WeddingForm["theme"],
          }))
        }
        className={fieldClass}
      >
        {themes.map((theme) => (
          <option key={theme} value={theme}>
            {themeNames[theme]}
          </option>
        ))}
      </select>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/app/weddings/${wedding.id}`}
          className="text-label-lg text-primary"
        >
          Cancel
        </Link>
        <button
          disabled={pending}
          className="rounded-lg bg-primary-container px-6 py-3 text-label-lg text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
