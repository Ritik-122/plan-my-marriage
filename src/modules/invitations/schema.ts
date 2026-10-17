import { z } from "zod";
export const rsvpSchema = z
  .object({
    responses: z
      .array(
        z
          .object({
            eventId: z
              .string()
              .regex(/^[a-f\d]{24}$/i)
              .transform((v) => v.toLowerCase()),
            status: z.enum(["ATTENDING", "NOT_ATTENDING"]),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .refine(
    (v) =>
      new Set(v.responses.map((r) => r.eventId)).size === v.responses.length,
    "Each event may appear only once.",
  );
export type RsvpInput = z.infer<typeof rsvpSchema>;
export const createLinkSchema = z
  .object({
    expiresAt: z.iso
      .datetime({ offset: true })
      .refine(
        (value) => Date.parse(value) > Date.now(),
        "Choose a future expiration date.",
      ),
  })
  .strict();
