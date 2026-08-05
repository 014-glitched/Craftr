"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared atmospheric page chrome for app surfaces (forge tokens). */
export function AppPageShell({
  title,
  description,
  meta,
  accent = "work",
  children,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  accent?: "work" | "docs" | "chat";
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const accentClass =
    accent === "docs"
      ? "from-lane-docs/25 via-lane-work/10 to-transparent"
      : accent === "chat"
        ? "from-lane-chat/25 via-lane-work/10 to-transparent"
        : "from-lane-work/30 via-lane-docs/10 to-transparent";

  return (
    <div
      className={cn(
        "-mx-6 -my-6 flex min-h-[calc(100dvh-3.5rem)] flex-col md:-mx-10 md:-my-10",
        className,
      )}
    >
      <header className="relative overflow-hidden border-b border-line bg-surface px-6 py-8 md:px-10 md:py-10">
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90",
            accentClass,
          )}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-0 size-56 rounded-full bg-lane-work/10 blur-3xl"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            {meta ? <div className="mb-2 text-sm text-ink-faint">{meta}</div> : null}
            <h1 className="font-display text-3xl tracking-[-0.045em] text-ink md:text-4xl lg:text-[2.75rem]">
              {title}
            </h1>
            {description ? (
              <div className="mt-3 max-w-[54ch] text-sm leading-relaxed text-ink-muted md:text-[15px]">
                {description}
              </div>
            ) : null}
          </div>
          {actions ? <div className="relative shrink-0">{actions}</div> : null}
        </div>
      </header>
      <div className="relative flex-1 px-6 py-8 md:px-10 md:py-10">{children}</div>
    </div>
  );
}

export function WorkspaceMonogram({
  name,
  muted = false,
}: {
  name: string;
  muted?: boolean;
}) {
  const letter = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-[10px] font-display text-sm tracking-tight",
        muted
          ? "border border-dashed border-line bg-canvas text-ink-faint"
          : "bg-brand-soft text-brand",
      )}
      aria-hidden
    >
      {letter}
    </span>
  );
}
