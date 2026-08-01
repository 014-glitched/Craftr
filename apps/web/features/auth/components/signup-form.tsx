"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { signUp } from "@/lib/auth-client";
import { useInviteGate } from "@/features/auth/hooks/use-invite-gate";
import {
  hasFieldErrors,
  passwordStrength,
  strengthLabel,
  validateSignupInput,
  type FieldErrors,
} from "@/lib/auth-validation";
import { cn } from "@/lib/utils";
import { emailsMatch, safeNextPath } from "@/lib/safe-next";
import { AuthShell } from "./auth-shell";
import { AuthField } from "./auth-field";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const loginHref =
    nextPath !== "/app"
      ? `/login?next=${encodeURIComponent(nextPath)}`
      : "/login";

  const {
    token: inviteToken,
    inviteEmail,
    organizationName,
    loading: inviteLoading,
    invalid: inviteInvalid,
  } = useInviteGate(nextPath);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const strength = passwordStrength(password);

  useEffect(() => {
    if (inviteEmail) setEmail(inviteEmail);
  }, [inviteEmail]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (inviteToken) {
      if (inviteInvalid || !inviteEmail) {
        setFormError("This invitation is invalid or has expired.");
        return;
      }
      if (!emailsMatch(email, inviteEmail)) {
        setFormError(
          `This invitation was sent to ${inviteEmail}. Create an account with that email to continue.`,
        );
        setFieldErrors((prev) => ({
          ...prev,
          email: "Use the invited email address.",
        }));
        return;
      }
    }

    const errors = validateSignupInput({ name, email, password });
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) return;

    setPending(true);

    try {
      const { error: authError } = await signUp.email({
        name: name.trim().replace(/\s+/g, " "),
        email: email.trim(),
        password,
      });

      if (authError) {
        setFormError(authError.message || "Unable to create your account.");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setFormError(
        "Unable to reach the server. Make sure the API is running on port 4000.",
      );
    } finally {
      setPending(false);
    }
  }

  if (inviteToken && inviteLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-ink-muted">
        <CircleNotch weight="bold" className="size-5 animate-spin text-brand" />
      </div>
    );
  }

  if (inviteToken && inviteInvalid) {
    return (
      <AuthShell
        title="Invitation unavailable"
        subtitle="This invite link is invalid, expired, or already used."
        footer={
          <Link href="/signup" className="font-medium text-brand hover:underline">
            Create an account normally
          </Link>
        }
      >
        <p className="text-sm text-ink-muted">
          Ask your teammate to send a new invitation.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        inviteEmail
          ? `Create an account as ${inviteEmail}${organizationName ? ` to join ${organizationName}` : ""}.`
          : "Join Craftr — one home for work, context, and signal."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={loginHref}
            className="font-medium text-brand underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {inviteEmail ? (
          <p className="rounded-[10px] border border-line bg-canvas px-3 py-2 text-xs text-ink-muted">
            This invitation is locked to <strong>{inviteEmail}</strong>. You
            must register with that address.
          </p>
        ) : null}

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
          readOnly={Boolean(inviteEmail)}
          error={fieldErrors.email}
          hint={
            inviteEmail
              ? "Email is fixed to the invitation recipient."
              : undefined
          }
          onChange={(e) => {
            if (inviteEmail) return;
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
