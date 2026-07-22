"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { signIn } from "@/lib/auth-client";
import {
  hasFieldErrors,
  validateLoginInput,
  type FieldErrors,
} from "@/lib/auth-validation";
import { AuthShell } from "./auth-shell";
import { AuthField } from "./auth-field";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateLoginInput({ email, password });
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) return;

    setPending(true);

    const { error: authError } = await signIn.email({
      email: email.trim(),
      password,
    });

    setPending(false);

    if (authError) {
      setFormError(
        authError.message || "Unable to sign in. Check your email and password.",
      );
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your workspace — work, docs, and signal in one place."
      footer={
        <>
          New to Craftr?{" "}
          <Link
            href="/signup"
            className="font-medium text-brand underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          error={fieldErrors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
        />

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
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
