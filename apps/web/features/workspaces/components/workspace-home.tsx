"use client";

import {
  ChatCircleDots,
  CheckSquare,
  FileText,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const lanes = [
  {
    title: "Work",
    subtitle: "Projects and tasks",
    body: "Boards and assignees arrive in Phase 4. This lane is where delivery lives.",
    color: "bg-lane-work",
    tint: "from-lane-work/20 to-transparent",
    Icon: CheckSquare,
    wide: true,
  },
  {
    title: "Context",
    subtitle: "Docs and files",
    body: "Decisions and specs stay beside the work they describe.",
    color: "bg-lane-docs",
    tint: "from-lane-docs/20 to-transparent",
    Icon: FileText,
    wide: false,
  },
  {
    title: "Signal",
    subtitle: "Chat and alerts",
    body: "Conversation and activity feed after core work tools ship.",
    color: "bg-lane-chat",
    tint: "from-lane-chat/20 to-transparent",
    Icon: ChatCircleDots,
    wide: false,
  },
] as const;

export function WorkspaceHome({
  workspaceName,
  orgName,
}: {
  workspaceName: string;
  orgName: string;
}) {
  return (
    <div className="-mx-6 -my-6 animate-auth-rise md:-mx-10 md:-my-10">
      <header className="relative overflow-hidden border-b border-line bg-surface px-6 py-10 md:px-10 md:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-lane-work/25 via-lane-docs/10 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-0 size-72 rounded-full bg-lane-work/15 blur-3xl"
        />
        <div className="relative">
          <p className="text-sm text-ink-faint">
            {orgName}
            <span className="mx-2 text-line-strong">/</span>
            {workspaceName}
          </p>
          <h1 className="mt-3 max-w-[14ch] font-display text-4xl tracking-[-0.05em] text-ink md:text-5xl lg:text-6xl">
            {workspaceName}
          </h1>
          <p className="mt-4 max-w-[48ch] text-ink-muted">
            Three lanes keep delivery, docs, and conversation from collapsing
            into one feed.
          </p>
        </div>
      </header>

      <div className="grid gap-3 p-6 md:grid-cols-2 md:p-10">
        {lanes.map(({ title, subtitle, body, color, tint, Icon, wide }, i) => (
          <div
            key={title}
            className={cn(
              "relative overflow-hidden rounded-[10px] border border-line bg-surface p-6 shadow-[var(--shadow-soft)] md:p-8",
              wide && "md:col-span-2 md:min-h-[220px]",
            )}
            style={{ animationDelay: `${60 + i * 50}ms` }}
          >
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
                tint,
              )}
            />
            <div className="relative flex items-start gap-4">
              <span
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-[10px] border border-line bg-canvas",
                )}
              >
                <Icon weight="bold" className="size-4 text-ink" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`size-1.5 rounded-full ${color}`} />
                  <p className="font-display text-xl tracking-[-0.03em] text-ink">
                    {title}
                  </p>
                </div>
                <p className="mt-1 text-xs text-ink-faint">{subtitle}</p>
                <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-ink-muted">
                  {body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
