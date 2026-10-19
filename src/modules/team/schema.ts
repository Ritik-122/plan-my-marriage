import { z } from "zod";
export const inviteSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    role: z.enum(["ADMIN", "MANAGER"]).default("MANAGER"),
  })
  .strict();
export const acceptSchema = z
  .object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })
  .strict();
