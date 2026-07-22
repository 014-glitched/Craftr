"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { signUp } from "@/lib/auth-client";
import {
  hasFieldErrors,
  passwordStrength,
  strengthLabel,
  validateSignupInput,
  type FieldErrors,
} from "@/lib/auth-validation";
import { cn } from "@/lib/utils";
import { AuthShell } from "./auth-shell";
import { AuthField } from "./auth-field";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const strength = passwordStrength(password);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateSignupInput({ name, email, password });
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) return;

    setPending(true);

    const { error: authError } = await signUp.email({
      name: name.trim().replace(/\s+/g, " "),
      email: email.trim(),
      password,
    });

    setPending(false);

    if (authError) {
      setFormError(authError.message || "Unable to create your account.");
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Craftr — one home for work, context, and signal."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-brand underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <AuthField
          id="name"
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={name}
          error={fieldErrors.name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) {
              setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }
          }}
        />
        <AuthField
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          value={email}
          error={fieldErrors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
        />
        <div>
          <AuthField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="Min 8 characters, with a letter and a number"
            value={password}
            error={fieldErrors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
          />
          {password.length > 0 && !fieldErrors.password ? (
            <div className="mt-2.5">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i < strength
                        ? strength <= 1
                          ? "bg-danger"
                          : strength === 2
                            ? "bg-lane-chat"
                            : "bg-brand"
                        : "bg-line-strong",
                    )}
                  />
                ))}
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-ink-faint">
                {strengthLabel[strength]}
              </p>
            </div>
          ) : null}
        </div>

        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-[10px] border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
          >
            <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-accent px-4 py-3 text-sm font-semibold text-accent-fg transition-[transform,opacity] enabled:hover:opacity-90 enabled:active:scale-[0.985] disabled:opacity-60"
        >
          {pending ? (
            <>
              <CircleNotch weight="bold" className="size-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
