import Link from "next/link";
import {
  ArrowRight,
  ChatCircleDots,
  CheckSquare,
  FileText,
} from "@phosphor-icons/react/dist/ssr";

const lanes = [
  {
    title: "Work",
    body: "Projects, tasks, and boards — the shipping lane.",
    color: "bg-lane-work",
    Icon: CheckSquare,
  },
  {
    title: "Context",
    body: "Docs and files beside the decisions they explain.",
    color: "bg-lane-docs",
    Icon: FileText,
  },
  {
    title: "Signal",
    body: "Chat, notifications, and activity in one feed.",
    color: "bg-lane-chat",
    Icon: ChatCircleDots,
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-auth-fade"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 8% -5%, color-mix(in oklab, var(--brand) 16%, transparent), transparent 55%), radial-gradient(ellipse 50% 40% at 95% 5%, color-mix(in oklab, var(--lane-docs) 12%, transparent), transparent 50%)",
        }}
      />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="font-display text-[1.65rem] tracking-[-0.04em] text-ink"
        >
          Craftr
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-ink-muted transition-colors hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 font-semibold text-accent-fg transition-[transform,opacity] hover:opacity-90 active:scale-[0.98]"
          >
            Get started
            <ArrowRight weight="bold" className="size-3.5" />
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 pb-24 pt-14 md:pt-20">
        <div className="auth-stagger max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1.5">
            <span className="flex gap-1">
              <span className="size-1.5 rounded-full bg-lane-work" />
              <span className="size-1.5 rounded-full bg-lane-docs" />
              <span className="size-1.5 rounded-full bg-lane-chat" />
            </span>
            <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase">
              One-stop engineering platform
            </p>
          </div>
          <h1 className="mt-6 font-display text-[2.85rem] leading-[1.02] tracking-[-0.045em] text-ink sm:text-6xl md:text-[4.1rem]">
            Craftr
          </h1>
          <p className="mt-3 font-display text-2xl leading-snug tracking-[-0.03em] text-ink/85 sm:text-3xl">
            Every lane of engineering work. One workspace.
          </p>
          <p className="mt-5 max-w-xl text-base text-ink-muted sm:text-lg">
            Stop hopping between trackers, docs, and chat. Craftr keeps shipping
            work color-coded and connected so your team always knows what
            belongs where.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition-[transform,opacity] hover:opacity-90 active:scale-[0.98]"
            >
              Create account
              <ArrowRight weight="bold" className="size-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-line-strong bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-canvas"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="animate-auth-rise grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
          {lanes.map(({ title, body, color, Icon }) => (
            <div
              key={title}
              className="rounded-2xl border border-line bg-surface p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2.5">
                <span className={`size-2 rounded-full ${color}`} />
                <span className="inline-flex size-8 items-center justify-center rounded-lg border border-line bg-canvas">
                  <Icon weight="bold" className="size-4 text-ink" />
                </span>
              </div>
              <p className="mt-4 font-display text-lg tracking-[-0.03em] text-ink">
                {title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
