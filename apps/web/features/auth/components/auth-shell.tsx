import Link from "next/link";
import type { ReactNode } from "react";
import {
  ChatCircleDots,
  CheckSquare,
  FileText,
} from "@phosphor-icons/react/dist/ssr";

const lanes = [
  {
    key: "work",
    label: "Work",
    detail: "Projects · tasks · boards",
    color: "bg-lane-work",
    Icon: CheckSquare,
  },
  {
    key: "docs",
    label: "Context",
    detail: "Docs · specs · files",
    color: "bg-lane-docs",
    Icon: FileText,
  },
  {
    key: "chat",
    label: "Signal",
    detail: "Chat · activity · alerts",
    color: "bg-lane-chat",
    Icon: ChatCircleDots,
  },
] as const;

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-ink text-accent-fg lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-11">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 15% 20%, rgba(15,118,110,0.35), transparent 55%), radial-gradient(ellipse 50% 40% at 85% 75%, rgba(29,78,137,0.28), transparent 50%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(244,247,250,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,250,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 40% 35%, black, transparent)",
          }}
        />

        <Link
          href="/"
          className="relative font-display text-[1.75rem] tracking-[-0.04em] text-accent-fg"
        >
          Craftr
        </Link>

        <div className="relative max-w-md animate-auth-rise">
          <p className="font-mono text-[11px] font-medium tracking-[0.16em] text-brand uppercase">
            One platform · every lane
          </p>
          <h2 className="mt-4 font-display text-[2.65rem] leading-[1.05] tracking-[-0.045em]">
            Know where work lives.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-accent-fg/70">
            Tasks, docs, and conversation stay color-coded and connected — so
            your team never loses the thread between shipping and deciding.
          </p>

          <ul className="mt-9 space-y-3">
            {lanes.map(({ key, label, detail, color, Icon }) => (
              <li
                key={key}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3"
              >
                <span
                  className={`lane-dot size-2.5 shrink-0 rounded-full ${color}`}
                />
                <Icon weight="bold" className="size-4 shrink-0 text-accent-fg/80" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-tight">{label}</p>
                  <p className="font-mono text-[11px] text-accent-fg/45">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-[11px] text-accent-fg/35">
          Engineering collaboration · Craftr
        </p>
      </aside>

      <main className="relative flex flex-col justify-center bg-canvas px-6 py-12 sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 70% 0%, color-mix(in oklab, var(--brand) 12%, transparent), transparent)",
          }}
        />
        <div className="relative mx-auto w-full max-w-[420px]">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 lg:hidden"
          >
            <span className="font-display text-2xl tracking-[-0.04em] text-ink">
              Craftr
            </span>
          </Link>
          <div className="auth-stagger">
            <div className="mb-6 flex gap-1.5 lg:hidden">
              <span className="size-2 rounded-full bg-lane-work" />
              <span className="size-2 rounded-full bg-lane-docs" />
              <span className="size-2 rounded-full bg-lane-chat" />
            </div>
            <h1 className="font-display text-[2rem] tracking-[-0.04em] text-ink sm:text-[2.15rem]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {subtitle}
            </p>
            <div className="mt-8">{children}</div>
            <div className="mt-8 text-sm text-ink-muted">{footer}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
