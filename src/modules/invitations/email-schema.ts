import { z } from "zod";
export const guestEmailSchema = z
  .object({
    requestId: z.uuid(),
    previewHash: z.string().regex(/^[a-f\d]{64}$/),
  })
  .strict();
export type GuestEmailInput = z.infer<typeof guestEmailSchema>;
