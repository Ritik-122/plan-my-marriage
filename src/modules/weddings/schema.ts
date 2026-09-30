import { z } from "zod";

export const themes = [
  "CLASSIC_INDIAN",
  "MODERN_MINIMAL",
  "ROYAL_INDIAN",
] as const;
export const themeNames = {
  CLASSIC_INDIAN: "Classic Indian",
  MODERN_MINIMAL: "Modern Minimal",
  ROYAL_INDIAN: "Royal Indian",
} as const;
export const defaultTimezone = "Asia/Kolkata";
const name = z.string().trim().min(1, "Enter a name.").max(100);
const date = z.iso
  .datetime({ offset: true })
  .refine(
    (value) => Number.isFinite(Date.parse(value)),
    "Choose a valid wedding date.",
  );
export const createWeddingSchema = z
  .object({
    brideName: name,
    groomName: name,
    weddingDate: date,
    city: z.string().trim().min(1, "Enter your wedding city.").max(200),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(80)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and single hyphens.",
      ),
    theme: z.enum(themes),
    description: z.string().trim().max(1000).default(""),
  })
  .strict();
export const updateWeddingSchema = createWeddingSchema
  .omit({ slug: true })
  .extend({ description: z.string().trim().max(1000) })
  .partial()
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one field to update.",
  );
export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;
export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>;
export type Theme = (typeof themes)[number];

export function suggestSlug(bride: string, groom: string) {
  const clean = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const parts = [clean(groom), clean(bride)];
  return parts.every(Boolean)
    ? `${parts[0]}-weds-${parts[1]}`.slice(0, 80).replace(/-$/, "")
    : "";
}
// Date inputs represent a calendar day in India, not midnight in the viewer's timezone.
export function dateInputToISO(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const parsed = new Date(`${value}T12:00:00+05:30`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    dateForInput(parsed.toISOString()) !== value
  )
    return "";
  return parsed.toISOString();
}
export function dateForInput(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: defaultTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function formatWeddingDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: defaultTimezone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
