"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function AuthField({
  id,
  label,
  hint,
  error,
  className,
  type = "text",
  ...props
}: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="block">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            "w-full rounded-[10px] border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow,transform]",
            "placeholder:text-ink-faint",
            "focus:border-brand focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_22%,transparent)]",
            error
              ? "border-danger focus:border-danger focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--danger)_20%,transparent)]"
              : "border-line-strong",
            isPassword && "pr-11",
            className,
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 text-ink-faint transition-colors hover:text-ink"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeSlash weight="bold" className="size-4" />
            ) : (
              <Eye weight="bold" className="size-4" />
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
