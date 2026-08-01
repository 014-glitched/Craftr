import { z } from "zod";

const NAME_RE =
  /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]{0,78}[\p{L}\p{M}'’.]$|^[\p{L}\p{M}]$/u;

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(254, "Email is too long.")
  .email("Enter a valid email address.");

const loginPasswordSchema = z
  .string()
  .min(1, "Enter your password.")
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.");

const signupPasswordSchema = loginPasswordSchema
  .refine((password) => /[A-Za-z]/.test(password), {
    message: "Password must include at least one letter.",
  })
  .refine((password) => /[0-9]/.test(password), {
    message: "Password must include at least one number.",
  });

const nameSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(1, "Enter your full name.")
      .min(2, "Name must be at least 2 characters.")
      .max(80, "Name must be 80 characters or fewer.")
      .regex(
        NAME_RE,
        "Use letters, spaces, hyphens, or apostrophes only.",
      ),
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: signupPasswordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
