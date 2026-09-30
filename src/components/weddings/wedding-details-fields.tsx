"use client";
import type { Theme } from "@/modules/weddings/schema";
export type WeddingForm = {
  brideName: string;
  groomName: string;
  weddingDate: string;
  city: string;
  description: string;
  slug: string;
  theme: Theme;
};
export const emptyWedding: WeddingForm = {
  brideName: "",
  groomName: "",
  weddingDate: "",
  city: "",
  description: "",
  slug: "",
  theme: "CLASSIC_INDIAN",
};
export const fieldClass =
  "w-full min-w-0 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3.5 py-3 text-base text-on-surface placeholder:text-outline focus:border-primary focus:outline-primary disabled:opacity-60";
export function WeddingDetailsFields({
  form,
  onChange,
  errors,
  disabled = false,
  showSlug = true,
}: {
  form: WeddingForm;
  onChange: (name: keyof WeddingForm, value: string) => void;
  errors: Record<string, string>;
  disabled?: boolean;
  showSlug?: boolean;
}) {
  const field = (
    name: keyof WeddingForm,
    label: string,
    type = "text",
    placeholder = "",
    maxLength = 100,
  ) => (
    <div key={name}>
      <label htmlFor={name} className="mb-2 block text-label-lg">
        {label} <span className="text-secondary">*</span>
      </label>
      <input
        className={fieldClass}
        id={name}
        name={name}
        type={type}
        value={form[name]}
        placeholder={placeholder}
        maxLength={maxLength}
        required
        disabled={disabled}
        onChange={(e) => onChange(name, e.target.value)}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
      />
      {errors[name] && (
        <p id={`${name}-error`} className="mt-1 text-body-sm text-error">
          {errors[name]}
        </p>
      )}
    </div>
  );
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap justify-between gap-2">
        <h2 className="text-label-md uppercase tracking-wider text-on-surface-variant">
          Couple overview
        </h2>
        <span className="text-body-sm text-secondary">* Required fields</span>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {field("brideName", "Bride’s name", "text", "e.g. Priya")}
        {field("groomName", "Groom’s name", "text", "e.g. Ritik")}
        {field("weddingDate", "Main wedding date", "date")}
        {field("city", "Wedding city", "text", "e.g. New Delhi, Udaipur", 200)}
      </div>
      <p className="text-body-sm text-on-surface-variant">
        Your main wedding day, in India Standard Time. Individual ceremony dates
        and venues can be added in a later step of planning.
      </p>
      <div className="border-t border-outline-variant/30 pt-6">
        <label htmlFor="description" className="mb-2 block text-label-lg">
          Short welcome note{" "}
          <span className="font-normal text-on-surface-variant">
            (optional)
          </span>
        </label>
        <textarea
          className={fieldClass}
          rows={3}
          id="description"
          name="description"
          value={form.description}
          maxLength={1000}
          disabled={disabled}
          placeholder="We would love for you to celebrate this joyous chapter with us."
          onChange={(e) => onChange("description", e.target.value)}
          aria-invalid={Boolean(errors.description)}
          aria-describedby="description-hint"
        />
        <p
          id="description-hint"
          className="mt-2 text-body-sm text-on-surface-variant"
        >
          {errors.description ||
            `${form.description.length}/1000 characters. You can change this later.`}
        </p>
      </div>
      {showSlug && (
        <div>
          <label htmlFor="slug" className="mb-2 block text-label-lg">
            Wedding website handle <span className="text-secondary">*</span>
          </label>
          <div className="flex min-w-0 items-center">
            <span className="rounded-l-lg border border-r-0 border-outline-variant/50 bg-surface-container px-3 py-3 text-base">
              /w/
            </span>
            <input
              id="slug"
              name="slug"
              className={`${fieldClass} rounded-l-none`}
              value={form.slug}
              maxLength={80}
              autoCapitalize="none"
              spellCheck={false}
              disabled={disabled}
              onChange={(e) => onChange("slug", e.target.value)}
              aria-invalid={Boolean(errors.slug)}
              aria-describedby="slug-hint"
              required
            />
          </div>
          <p
            id="slug-hint"
            className={`mt-2 text-body-sm ${errors.slug ? "text-error" : "text-on-surface-variant"}`}
          >
            {errors.slug ||
              "We’ll check availability when you create your wedding. Your website starts unpublished."}
          </p>
        </div>
      )}
    </div>
  );
}
