export type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]{0,78}[\p{L}\p{M}'’.]$|^[\p{L}\p{M}]$/u;

export function validateName(raw: string): string | undefined {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) return "Enter your full name.";
  if (name.length < 2) return "Name must be at least 2 characters.";
  if (name.length > 80) return "Name must be 80 characters or fewer.";
  if (!NAME_RE.test(name)) {
    return "Use letters, spaces, hyphens, or apostrophes only.";
  }
  return undefined;
}

export function validateEmail(raw: string): string | undefined {
  const email = raw.trim();
  if (!email) return "Enter your email address.";
  if (email.length > 254) return "Email is too long.";
  if (!EMAIL_RE.test(email)) return "Enter a valid email address.";
  return undefined;
}

export function validatePassword(
  password: string,
  mode: "login" | "signup",
): string | undefined {
  if (!password) return "Enter your password.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password must be 128 characters or fewer.";
  if (mode === "signup") {
    if (!/[A-Za-z]/.test(password)) {
      return "Password must include at least one letter.";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must include at least one number.";
    }
  }
  return undefined;
}

export function validateLoginInput(input: {
  email: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const email = validateEmail(input.email);
  const password = validatePassword(input.password, "login");
  if (email) errors.email = email;
  if (password) errors.password = password;
  return errors;
}

export function validateSignupInput(input: {
  name: string;
  email: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const name = validateName(input.name);
  const email = validateEmail(input.email);
  const password = validatePassword(input.password, "signup");
  if (name) errors.name = name;
  if (email) errors.email = email;
  if (password) errors.password = password;
  return errors;
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
