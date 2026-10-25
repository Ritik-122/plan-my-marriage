import { z } from "zod";
export const imageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const maxImageBytes = 10485760;
export const purposes = ["EVENT_GALLERY", "WEDDING_GALLERY"] as const;
const id = z.string().regex(/^[a-f\d]{24}$/i);
const fileName = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .refine((v) => !/[\x00-\x1f\x7f]/.test(v));
const scope = { purpose: z.enum(purposes), eventId: id.nullable().optional() };
const validScope = (v: { purpose: string; eventId?: string | null }) =>
  v.purpose === "EVENT_GALLERY" ? !!v.eventId : !v.eventId;
export const presignSchema = z
  .object({
    ...scope,
    fileName,
    mimeType: z.enum(imageTypes),
    sizeBytes: z.number().int().min(1).max(maxImageBytes),
  })
  .strict()
  .refine(
    validScope,
    "Choose an event for event photos; leave it empty for general wedding photos.",
  );
export const finalizeSchema = z
  .object({
    ...scope,
    objectKey: z
      .string()
      .regex(/^weddings\/[a-f\d]{24}\/photos\/[a-f\d-]{36}\.(jpg|png|webp)$/),
    originalFileName: fileName,
  })
  .strict()
  .refine(validScope, "Invalid photo scope.");
export const photoFiltersSchema = z
  .object({
    eventId: z.union([id, z.literal("general")]).optional(),
    purpose: z.enum(purposes).optional(),
    uploadedByType: z.enum(["ADMIN", "MANAGER", "GUEST"]).optional(),
    cursor: z.string().max(500).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(24),
  })
  .strict();
export const photoCursorSchema = z
  .object({ date: z.iso.datetime(), id })
  .strict();
export type PresignInput = z.infer<typeof presignSchema>;
export type FinalizeInput = z.infer<typeof finalizeSchema>;
export type PhotoFilters = z.infer<typeof photoFiltersSchema>;
export function imageSignatureMatches(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mimeType === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  return (
    mimeType === "image/webp" &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}
