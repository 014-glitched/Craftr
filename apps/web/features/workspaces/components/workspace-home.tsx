import {
  ChatCircleDots,
  CheckSquare,
  FileText,
} from "@phosphor-icons/react/dist/ssr";

const lanes = [
  {
    title: "Work",
    subtitle: "Projects & tasks",
    body: "Shipping lane — boards and assignees arrive in Phase 4.",
    color: "bg-lane-work",
    Icon: CheckSquare,
  },
  {
    title: "Context",
    subtitle: "Docs & files",
    body: "Decisions and specs live beside the work they describe.",
    color: "bg-lane-docs",
    Icon: FileText,
  },
  {
    title: "Signal",
    subtitle: "Chat & alerts",
    body: "Conversation and activity feed — coming after core work tools.",
    color: "bg-lane-chat",
    Icon: ChatCircleDots,
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
    <div className="animate-auth-rise mx-auto max-w-4xl">
      <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-ink-faint uppercase">
        {orgName} / {workspaceName}
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-[-0.045em] text-ink">
        Your workspace is ready.
      </h1>
      <p className="mt-3 max-w-xl text-ink-muted">
        Everything in Craftr is organized into three lanes — so you always know
        where work, context, and signal belong.
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {lanes.map(({ title, subtitle, body, color, Icon }) => (
          <div
            key={title}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${color}`} />
              <span className="inline-flex size-8 items-center justify-center rounded-lg border border-line bg-canvas">
                <Icon weight="bold" className="size-4" />
              </span>
            </div>
            <p className="mt-4 font-display text-lg tracking-[-0.03em]">
              {title}
            </p>
            <p className="font-mono text-[11px] text-ink-faint">{subtitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
