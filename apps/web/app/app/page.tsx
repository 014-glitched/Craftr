import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

export default function AppHomePage() {
  return (
    <div className="animate-auth-rise mx-auto max-w-2xl">
      <div className="flex gap-1.5">
        <span className="size-2 rounded-full bg-lane-work" />
        <span className="size-2 rounded-full bg-lane-docs" />
        <span className="size-2 rounded-full bg-lane-chat" />
      </div>
      <p className="mt-4 font-mono text-[11px] font-medium tracking-[0.14em] text-ink-faint uppercase">
        Authenticated · Phase 1
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-[-0.045em] text-ink">
        Your workspace starts here.
      </h1>
      <p className="mt-4 text-ink-muted">
        You are signed in. Next we add organizations and workspaces — the
        multi-tenant home for Work, Context, and Signal.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Work", tone: "bg-lane-work", text: "Projects & tasks" },
          { label: "Context", tone: "bg-lane-docs", text: "Docs & files" },
          { label: "Signal", tone: "bg-lane-chat", text: "Chat & alerts" },
        ].map((lane) => (
          <div
            key={lane.label}
            className="rounded-2xl border border-line bg-surface p-4"
          >
            <span className={`inline-block size-2 rounded-full ${lane.tone}`} />
            <p className="mt-3 font-display text-base tracking-[-0.03em]">
              {lane.label}
            </p>
            <p className="mt-1 text-xs text-ink-muted">{lane.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
