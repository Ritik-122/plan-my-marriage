import { z } from "zod";
export const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid identifier.");
const email = z.union([z.literal(""), z.email().max(254)]);
const phone = z
  .string()
  .trim()
  .max(40)
  .transform((v) => v.replace(/[\s().-]/g, ""))
  .refine(
    (v) => v === "" || /^\+?[0-9]{7,15}$/.test(v),
    "Use 7–15 digits, with an optional + country code.",
  );
export const createGuestSchema = z
  .object({
    name: z.string().trim().min(1, "Enter the guest’s name.").max(150),
    email: z.string().trim().toLowerCase().pipe(email).optional(),
    phone: phone.optional(),
    notes: z.string().trim().max(2000).optional(),
    guestGroupId: objectId.nullable().optional(),
  })
  .strict();
export const updateGuestSchema = createGuestSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Provide a field to update.");
export const assignmentSchema = z
  .object({
    guestIds: z
      .array(objectId)
      .min(1)
      .max(100)
      .transform((ids) => [...new Set(ids.map((id) => id.toLowerCase()))]),
  })
  .strict();
export const guestFiltersSchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    groupId: objectId.optional(),
    eventId: objectId.optional(),
    rsvpStatus: z.enum(["PENDING", "ATTENDING", "NOT_ATTENDING"]).optional(),
    cursor: z.string().min(1).max(800).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine(
    (v) => !v.rsvpStatus || Boolean(v.eventId),
    "Select an event when filtering RSVP status.",
  );
export type GuestInput = z.infer<typeof createGuestSchema>;
export type GuestUpdate = z.infer<typeof updateGuestSchema>;
export type GuestFilters = z.infer<typeof guestFiltersSchema>;
