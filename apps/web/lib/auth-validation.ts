import {
  loginSchema,
  signupSchema,
  safeParseFields,
} from "@craftr/validation";

export type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

export function validateLoginInput(input: {
  email: string;
  password: string;
}): FieldErrors {
  const result = safeParseFields<"email" | "password">(loginSchema, input);
  return result.success ? {} : result.errors;
}

export function validateSignupInput(input: {
  name: string;
  email: string;
  password: string;
}): FieldErrors {
  const result = safeParseFields<"name" | "email" | "password">(
    signupSchema,
    input,
  );
  return result.success ? {} : result.errors;
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Boolean(errors.name || errors.email || errors.password);
}

/** 0–4 strength score for signup UX */
export function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

export const strengthLabel = ["Too weak", "Weak", "Fair", "Good", "Strong"] as const;
