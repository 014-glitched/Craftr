"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import {
  ArrowRight,
  CheckCircle,
  CircleDashed,
  HourglassMedium,
  Flag,
  SquaresFour,
  UsersThree,
} from "@phosphor-icons/react";
import {
  MY_ORGANIZATIONS,
  MY_WORKSPACES,
  ORGANIZATION_MEMBERS,
  type MyOrganizationsQuery,
  type MyWorkspacesQuery,
  type OrganizationMembersQuery,
} from "@/features/organizations/graphql/operations";
import {
  WORKSPACE_TEAMS,
  type WorkspaceTeamsQuery,
} from "@/features/teams/graphql/operations";
import { AppPageShell } from "@/features/app/components/app-page-shell";
import {
  buildSetupItems,
  phaseCounts,
  ROADMAP_PHASES,
} from "@/features/dashboard/data/phases";
import { useTenancyStore } from "@/features/tenancy/store/workspace-context";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function OrgDashboard() {
  const { data: session } = useSession();
  const activeOrgSlug = useTenancyStore((s) => s.activeOrgSlug);
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const { data: orgData, loading: orgLoading } =
    useQuery<MyOrganizationsQuery>(MY_ORGANIZATIONS);
  const orgs = orgData?.myOrganizations ?? [];
  const org =
    orgs.find((o) => o.slug === activeOrgSlug) ?? orgs[0] ?? null;
  const canAdmin = org?.myRole === "OWNER" || org?.myRole === "ADMIN";

  const { data: wsData, loading: wsLoading } = useQuery<MyWorkspacesQuery>(
    MY_WORKSPACES,
    {
      variables: {
        organizationId: org?.id ?? "",
        includeArchived: canAdmin,
      },
      skip: !org?.id,
    },
  );

  const allWorkspaces = wsData?.myWorkspaces ?? [];
  const activeWorkspaces = allWorkspaces.filter((w) => !w.archivedAt);
  const archivedWorkspaces = allWorkspaces.filter((w) => w.archivedAt);
  const primaryWorkspace = activeWorkspaces[0] ?? null;

  const { data: membersData, loading: membersLoading } =
    useQuery<OrganizationMembersQuery>(ORGANIZATION_MEMBERS, {
      variables: { organizationId: org?.id ?? "" },
      skip: !org?.id,
    });
  const members = membersData?.organizationMembers ?? [];

  const { data: teamsData, loading: teamsLoading } =
    useQuery<WorkspaceTeamsQuery>(WORKSPACE_TEAMS, {
      variables: { workspaceId: primaryWorkspace?.id ?? "" },
      skip: !primaryWorkspace?.id,
    });
  const teams = teamsData?.workspaceTeams ?? [];

  const loading =
    orgLoading || (org && (wsLoading || membersLoading || teamsLoading));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-[10px] bg-line" />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-[10px] bg-line md:col-span-2" />
          <div className="h-28 animate-pulse rounded-[10px] bg-line" />
        </div>
        <div className="h-48 animate-pulse rounded-[10px] bg-line" />
      </div>
    );
  }

  if (!org) return null;

  const counts = phaseCounts();
  const setup = buildSetupItems({
    orgSlug: org.slug,
    activeWorkspaces: activeWorkspaces.length,
    teamCount: teams.length,
    memberCount: members.length,
    canAdmin,
  });
  const pendingSetup = setup.filter((s) => !s.done);
  const doneSetup = setup.filter((s) => s.done);
  const currentPhase = ROADMAP_PHASES.find((p) => p.status === "current");
  const primaryHref =
    activeWorkspaces.length === 0
      ? `/app/${org.slug}/workspaces`
      : `/app/${org.slug}/${primaryWorkspace!.slug}`;

  return (
    <AppPageShell
      accent="work"
      meta="Dashboard"
      title={`Hey ${firstName}`}
      description={
        <>
          {org.name} at a glance: what is done, what is pending, and where the
          product roadmap sits next.
        </>
      }
      actions={
        <Link
          href={primaryHref}
          className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition-[transform,opacity] enabled:hover:opacity-90 enabled:active:scale-[0.98]"
        >
          {activeWorkspaces.length === 0 ? "Create workspace" : "Open workspace"}
          <ArrowRight weight="bold" className="size-4" />
        </Link>
      }
    >
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Pulse metrics: asymmetric 5 / 4 / 3 */}
        <section className="grid gap-3 md:grid-cols-12">
          <MetricTile
            className="md:col-span-5"
            label="Pending setup"
            value={pendingSetup.length}
            hint={
              pendingSetup.length === 0
                ? "Org bootstrap looks complete"
                : "Finish these to unlock smoother collaboration"
            }
            icon={<HourglassMedium weight="bold" className="size-4 text-lane-chat" />}
            tone="chat"
          />
          <MetricTile
            className="md:col-span-4"
            label="Checklist done"
            value={`${doneSetup.length}/${setup.length}`}
            hint={`${activeWorkspaces.length} spaces, ${teams.length} teams, ${members.length} people`}
            icon={<CheckCircle weight="bold" className="size-4 text-brand" />}
            tone="work"
          />
          <MetricTile
            className="md:col-span-3"
            label="Roadmap done"
            value={`${counts.done}/${counts.total}`}
            hint={
              currentPhase
                ? `Now building: ${currentPhase.name}`
                : "All phases complete"
            }
            icon={<Flag weight="bold" className="size-4 text-lane-docs" />}
            tone="docs"
          />
        </section>

        {/* Current phase callout + pending checklist */}
        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden rounded-[10px] border border-line bg-surface p-6 shadow-[var(--shadow-soft)] md:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-lane-work/20 via-transparent to-lane-docs/10"
            />
            <div className="relative">
              <p className="text-xs font-medium text-ink-faint">Up next</p>
              <h2 className="mt-2 font-display text-3xl tracking-[-0.045em] text-ink md:text-4xl">
                {currentPhase?.name ?? "Ship"}
              </h2>
              <p className="mt-3 max-w-[42ch] text-sm text-ink-muted">
                {currentPhase
                  ? `${currentPhase.blurb}. Projects and tasks are the next vertical slice after teams.`
                  : "Roadmap complete for the current plan."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href={`/app/${org.slug}/teams`}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-canvas px-3 py-2 text-sm font-medium text-ink transition-[transform,colors] hover:border-line-strong enabled:active:scale-[0.98]"
                >
                  <UsersThree weight="bold" className="size-4 text-lane-docs" />
                  Teams ready
                </Link>
                <Link
                  href={`/app/${org.slug}/workspaces`}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-canvas px-3 py-2 text-sm font-medium text-ink transition-[transform,colors] hover:border-line-strong enabled:active:scale-[0.98]"
                >
                  <SquaresFour weight="bold" className="size-4 text-brand" />
                  Workspaces
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-line bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-lg tracking-[-0.03em] text-ink">
                Your checklist
              </h2>
              <span className="font-mono text-[11px] text-ink-faint">
                {doneSetup.length}/{setup.length}
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {setup.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-start gap-3 rounded-[10px] border px-3 py-3 transition-[transform,border-color,background-color]",
                      item.done
                        ? "border-transparent bg-canvas/70"
                        : "border-line bg-canvas hover:border-line-strong",
                      "enabled:active:scale-[0.99]",
                    )}
                  >
                    {item.done ? (
                      <CheckCircle
                        weight="fill"
                        className="mt-0.5 size-4 shrink-0 text-brand"
                      />
                    ) : (
                      <CircleDashed
                        weight="bold"
                        className="mt-0.5 size-4 shrink-0 text-lane-chat"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-sm font-medium",
                          item.done ? "text-ink-muted line-through" : "text-ink",
                        )}
                      >
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-faint">
                        {item.done ? "Done" : item.detail}
                      </span>
                    </span>
                    {!item.done ? (
                      <ArrowRight
                        weight="bold"
                        className="mt-1 size-3.5 shrink-0 text-ink-faint"
                      />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Live org snapshot */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatChip
            label="Active spaces"
            value={activeWorkspaces.length}
            href={`/app/${org.slug}/workspaces`}
          />
          <StatChip
            label="Archived"
            value={archivedWorkspaces.length}
            href={`/app/${org.slug}/workspaces`}
          />
          <StatChip
            label="Teams"
            value={teams.length}
            hint={
              primaryWorkspace
                ? `in ${primaryWorkspace.name}`
                : "needs a workspace"
            }
            href={`/app/${org.slug}/teams`}
          />
          <StatChip
            label="Members"
            value={members.length}
            href={`/app/${org.slug}/settings`}
          />
        </section>

        {/* Phase journey */}
        <section className="rounded-[10px] border border-line bg-surface p-5 shadow-[var(--shadow-soft)] md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                Product phases
              </h2>
              <p className="mt-1 max-w-[48ch] text-sm text-ink-muted">
                Shipped through Teams. Next up is Projects, then Kanban and the
                collaboration stack.
              </p>
            </div>
            <p className="font-mono text-[11px] text-ink-faint">
              {counts.done} done, {counts.upcoming} ahead
            </p>
          </div>

          <ol className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8 xl:grid-cols-[repeat(15,minmax(0,1fr))]">
            {ROADMAP_PHASES.map((phase) => {
              const href =
                phase.href && org
                  ? `/app/${org.slug}/${phase.href}`
                  : undefined;
              const body = (
                <>
                  <span className="font-mono text-[10px] text-ink-faint">
                    P{phase.id}
                  </span>
                  <span className="mt-1 block truncate text-[11px] font-medium leading-tight text-ink sm:text-xs">
                    {phase.name}
                  </span>
                </>
              );
              return (
                <li key={phase.id}>
                  {href ? (
                    <Link
                      href={href}
                      title={phase.blurb}
                      className={cn(
                        "flex h-full min-h-[4.5rem] flex-col rounded-[10px] border px-2 py-2 transition-[transform,border-color] enabled:active:scale-[0.98]",
                        phaseTone(phase.status),
                      )}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div
                      title={phase.blurb}
                      className={cn(
                        "flex h-full min-h-[4.5rem] flex-col rounded-[10px] border px-2 py-2",
                        phaseTone(phase.status),
                      )}
                    >
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-5 flex flex-wrap gap-4 text-xs text-ink-faint">
            <LegendDot className="bg-brand" label="Done" />
            <LegendDot className="bg-lane-chat" label="Current" />
            <LegendDot className="bg-line-strong" label="Upcoming" />
          </div>
        </section>

        {/* What else to add later */}
        <section className="grid gap-3 md:grid-cols-[1fr_1.2fr]">
          <div className="rounded-[10px] border border-dashed border-line bg-canvas/80 p-5">
            <h2 className="font-display text-lg tracking-[-0.03em] text-ink">
              Coming onto this board
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-muted">
              <li>Open tasks vs completed (Phase 4)</li>
              <li>Kanban WIP by column (Phase 5)</li>
              <li>Unread notifications (Phase 6)</li>
              <li>Recent docs and files (Phases 7-8)</li>
            </ul>
          </div>
          <div className="rounded-[10px] border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
            <h2 className="font-display text-lg tracking-[-0.03em] text-ink">
              Jump back in
            </h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[
                {
                  href: `/app/${org.slug}/workspaces`,
                  label: "Workspaces",
                  hint: `${activeWorkspaces.length} active`,
                },
                {
                  href: `/app/${org.slug}/teams`,
                  label: "Teams",
                  hint: `${teams.length} groups`,
                },
                {
                  href: `/app/${org.slug}/audit`,
                  label: "Audit",
                  hint: "Owner trail",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[10px] border border-line bg-canvas px-3 py-3 transition-[transform,border-color] hover:border-line-strong enabled:active:scale-[0.98]"
                >
                  <p className="text-sm font-medium text-ink">{item.label}</p>
                  <p className="mt-1 text-xs text-ink-faint">{item.hint}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppPageShell>
  );
}

function phaseTone(status: "done" | "current" | "upcoming") {
  if (status === "done") {
    return "border-brand/30 bg-brand-soft/70";
  }
  if (status === "current") {
    return "border-lane-chat/40 bg-lane-chat/10 ring-1 ring-lane-chat/30";
  }
  return "border-line bg-canvas text-ink-muted";
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-1.5 rounded-full", className)} />
      {label}
    </span>
  );
}

function MetricTile({
  label,
  value,
  hint,
  icon,
  tone,
  className,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
  tone: "work" | "docs" | "chat";
  className?: string;
}) {
  const wash =
    tone === "docs"
      ? "from-lane-docs/15"
      : tone === "chat"
        ? "from-lane-chat/15"
        : "from-lane-work/15";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[10px] border border-line bg-surface p-5 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent",
          wash,
        )}
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-ink-faint">{label}</p>
          {icon}
        </div>
        <p className="mt-3 font-display text-4xl tracking-[-0.05em] text-ink">
          {value}
        </p>
        <p className="mt-2 text-xs text-ink-muted">{hint}</p>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number;
  hint?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[10px] border border-line bg-surface px-4 py-4 shadow-[var(--shadow-soft)] transition-[transform,border-color] hover:border-line-strong enabled:active:scale-[0.99]"
    >
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="mt-2 font-display text-2xl tracking-[-0.04em] text-ink">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-ink-faint">{hint}</p> : null}
    </Link>
  );
}
