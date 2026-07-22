"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  SquaresFour,
  SignOut,
  CircleNotch,
} from "@phosphor-icons/react";
import { signOut, useSession } from "@/lib/auth-client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  if (isPending || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-ink-muted">
        <CircleNotch weight="bold" className="size-5 animate-spin text-brand" />
      </div>
    );
  }

  const user = session.user;
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="border-b border-line px-5 py-5">
          <Link
            href="/app"
            className="font-display text-xl tracking-[-0.04em] text-ink"
          >
            Craftr
          </Link>
          <div className="mt-3 flex gap-1">
            <span className="size-1.5 rounded-full bg-lane-work" />
            <span className="size-1.5 rounded-full bg-lane-docs" />
            <span className="size-1.5 rounded-full bg-lane-chat" />
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <Link
            href="/app"
            className="flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-2 text-sm font-medium text-ink"
          >
            <SquaresFour weight="bold" className="size-4 text-brand" />
            Home
          </Link>
          <p className="mt-4 px-3 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
            Coming in Phase 2
          </p>
          <div className="space-y-1 px-1 opacity-50">
            <div className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-muted">
              <span className="size-1.5 rounded-full bg-lane-work" />
              Workspaces
            </div>
            <div className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-muted">
              <span className="size-1.5 rounded-full bg-lane-docs" />
              Organizations
            </div>
          </div>
        </nav>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs font-medium text-accent-fg">
              {initials || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {user.name}
              </p>
              <p className="truncate text-xs text-ink-faint">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <SignOut weight="bold" className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-3 md:hidden">
          <Link
            href="/app"
            className="font-display text-lg tracking-[-0.04em]"
          >
            Craftr
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm text-ink-muted"
          >
            Sign out
          </button>
        </header>
        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
