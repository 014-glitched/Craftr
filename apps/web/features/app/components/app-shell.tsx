"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { SignOut, CircleNotch } from "@phosphor-icons/react";
import { signOut, useSession } from "@/lib/auth-client";
import {
  OrgSwitcher,
  WorkspaceSwitcher,
  OrgNav,
  LaneNavPlaceholder,
  HomeNavLink,
} from "@/features/workspaces/components/workspace-switcher";
import { useTenancyStore } from "@/features/tenancy/store/workspace-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const activeOrgSlug = useTenancyStore((s) => s.activeOrgSlug);

  const orgSlugFromPath = pathname.match(/^\/app\/([^/]+)/)?.[1];
  const navOrgSlug =
    orgSlugFromPath && orgSlugFromPath !== "onboarding"
      ? orgSlugFromPath
      : activeOrgSlug;

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  async function handleSignOut() {
    useTenancyStore.getState().clear();
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

  const isOnboarding = pathname.startsWith("/app/onboarding");
  const homeHref =
    navOrgSlug && !isOnboarding
      ? `/app/${navOrgSlug}/${useTenancyStore.getState().activeWorkspaceSlug ?? "general"}`
      : "/app";
  const homeActive = Boolean(
    pathname.match(/^\/app\/[^/]+\/[^/]+$/) && !pathname.endsWith("/settings"),
  );

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {!isOnboarding ? (
        <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 flex-col border-r border-line bg-surface md:flex">
          {/* Brand + org — fixed at top */}
          <div className="shrink-0 border-b border-line px-5 py-5">
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
            <div className="mt-4">
              <OrgSwitcher />
            </div>
          </div>

          {/* Scrollable nav — accordion growth stays inside here */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="pt-2">
              <HomeNavLink href={homeHref} active={homeActive} />
            </div>
            {navOrgSlug ? (
              <>
                <WorkspaceSwitcher orgSlug={navOrgSlug} />
                <OrgNav orgSlug={navOrgSlug} />
              </>
            ) : null}
            <LaneNavPlaceholder />
          </div>

          {/* User — pinned at bottom */}
          <div className="shrink-0 border-t border-line p-3">
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
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {!isOnboarding ? (
          <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-3 md:hidden">
            <Link href="/app" className="font-display text-lg tracking-[-0.04em]">
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
        ) : null}
        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
