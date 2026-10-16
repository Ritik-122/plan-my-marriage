import { z } from "zod";
export const eventTypes = [
  "HALDI",
  "MEHENDI",
  "SANGEET",
  "WEDDING",
  "RECEPTION",
  "CUSTOM",
] as const;
export const typeNames = {
  HALDI: "Haldi",
  MEHENDI: "Mehendi",
  SANGEET: "Sangeet",
  WEDDING: "Wedding",
  RECEPTION: "Reception",
  CUSTOM: "Custom",
};
const timestamp = z.iso.datetime({ offset: true });
const url = z.union([
  z.literal(""),
  z
    .url()
    .max(2048)
    .refine(
      (v) => ["http:", "https:"].includes(new URL(v).protocol),
      "Use an http or https link.",
    ),
]);
const venue = z
  .object({
    name: z.string().trim().max(200).optional(),
    address: z.string().trim().max(500).optional(),
    mapUrl: url.optional(),
  })
  .strict();
const fields = z
  .object({
    name: z.string().trim().min(1, "Enter an event name.").max(150),
    type: z.enum(eventTypes),
    startsAt: timestamp,
    endsAt: timestamp.nullable().optional(),
    description: z.string().trim().max(2000).optional(),
    dressCode: z.string().trim().max(200).optional(),
    venue: venue.optional(),
    livestreamUrl: url.nullable().optional(),
    visibility: z.enum(["PUBLIC", "INVITED_ONLY"]),
  })
  .strict();
export function validRange(value: {
  startsAt?: string;
  endsAt?: string | null;
}) {
  return (
    !value.startsAt ||
    !value.endsAt ||
    Date.parse(value.endsAt) > Date.parse(value.startsAt)
  );
}
export const createEventSchema = fields
  .extend({ visibility: fields.shape.visibility.default("INVITED_ONLY") })
  .refine(validRange, {
    path: ["endsAt"],
    message: "End must be after the start.",
  });
export const updateEventSchema = fields
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Provide a field to update.")
  .refine(validRange, {
    path: ["endsAt"],
    message: "End must be after the start.",
  });
export const eventFiltersSchema = z
  .object({ from: timestamp.optional(), to: timestamp.optional() })
  .strict()
  .refine(
    (v) => !v.from || !v.to || Date.parse(v.from) <= Date.parse(v.to),
    "From must not be after to.",
  );
export type EventInput = z.infer<typeof createEventSchema>;
export type EventUpdate = z.infer<typeof updateEventSchema>;
export type EventFilters = z.infer<typeof eventFiltersSchema>;
export function localDateTime(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (key: string) => parts.find((p) => p.type === key)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
export function toUTC(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return "";
  const date = new Date(`${value}:00+05:30`);
  return Number.isFinite(date.getTime()) &&
    localDateTime(date.toISOString()) === value
    ? date.toISOString()
    : "";
}
export function eventDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
export function eventTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
