import { z } from "zod";
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
