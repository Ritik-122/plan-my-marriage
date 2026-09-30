import { z } from "zod";

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
// bcrypt accepts at most 72 UTF-8 bytes. Reject rather than silently truncate.
const password = z
  .string()
  .min(1, "Enter your password.")
  .max(72)
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Password is too long. Use fewer characters.",
  );
export const loginSchema = z.object({ email, password }).strict();
export const registerSchema = z
  .object({
    displayName: z.string().trim().min(1, "Enter your name.").max(100),
    email,
    password: password.refine(
      (value) => value.length >= 12,
      "Use at least 12 characters.",
    ),
  })
  .strict();
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
