"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { Plus, UsersThree } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  MY_ORGANIZATIONS,
  MY_WORKSPACES,
  type MyOrganizationsQuery,
  type MyWorkspacesQuery,
} from "@/features/organizations/graphql/operations";
import {
  WORKSPACE_TEAMS,
  type WorkspaceTeamsQuery,
} from "@/features/teams/graphql/operations";
import { CreateTeamModal } from "@/features/teams/components/create-team-modal";
import { TeamMembersPanel } from "@/features/teams/components/team-members-panel";
import { AppPageShell } from "@/features/app/components/app-page-shell";
import { useTenancyStore } from "@/features/tenancy/store/workspace-context";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function OrgTeamsPage() {
  const params = useParams<{ orgSlug: string }>();
  const { data: session } = useSession();
  const activeWorkspaceSlug = useTenancyStore((s) => s.activeWorkspaceSlug);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: orgData, loading: orgLoading } =
    useQuery<MyOrganizationsQuery>(MY_ORGANIZATIONS);
  const org = orgData?.myOrganizations?.find((o) => o.slug === params.orgSlug);
  const canCreateTeam = org?.myRole === "OWNER";
  const canOrgAdmin = org?.myRole === "OWNER" || org?.myRole === "ADMIN";

  const { data: wsData, loading: wsLoading } = useQuery<MyWorkspacesQuery>(
    MY_WORKSPACES,
    {
      variables: { organizationId: org?.id ?? "", includeArchived: false },
      skip: !org?.id,
    },
  );

  const workspaces = (wsData?.myWorkspaces ?? []).filter((w) => !w.archivedAt);

  useEffect(() => {
    if (workspaces.length === 0 || workspaceId) return;
    const preferred =
      workspaces.find((w) => w.slug === activeWorkspaceSlug) ?? workspaces[0];
    if (preferred) setWorkspaceId(preferred.id);
  }, [workspaces, workspaceId, activeWorkspaceSlug]);

  const workspace =
    workspaces.find((w) => w.id === workspaceId) ?? workspaces[0] ?? null;

  const { data: teamsData, loading: teamsLoading } = useQuery<
    WorkspaceTeamsQuery
  >(WORKSPACE_TEAMS, {
    variables: { workspaceId: workspace?.id ?? "" },
    skip: !workspace?.id,
  });

  const teams = teamsData?.workspaceTeams ?? [];
  const selected =
    teams.find((t) => t.id === selectedTeamId) ?? teams[0] ?? null;

  if (orgLoading || wsLoading || (workspace && teamsLoading)) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-line" />
      </div>
    );
  }

  if (!org) {
    return (
      <p className="text-ink-muted">
        Organization not found.{" "}
        <Link href="/app" className="text-brand hover:underline">
          Go home
        </Link>
      </p>
    );
  }

  if (!workspace) {
    return (
      <p className="text-ink-muted">
        No workspaces yet.{" "}
        <Link
          href={`/app/${params.orgSlug}/workspaces`}
          className="text-brand hover:underline"
        >
          Create a workspace
        </Link>{" "}
        to manage teams.
      </p>
    );
  }

  return (
    <AppPageShell
      accent="docs"
      title="Teams"
      description={
        <>
          Groups inside{" "}
          {workspaces.length > 1 ? (
            <label className="inline-flex items-center gap-1.5">
              <span className="sr-only">Workspace</span>
              <select
                value={workspace.id}
                onChange={(e) => {
                  setWorkspaceId(e.target.value);
                  setSelectedTeamId(null);
                }}
                className="cursor-pointer border-0 bg-transparent p-0 font-medium text-ink outline-none"
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="font-medium text-ink">{workspace.name}</span>
          )}
          .
        </>
      }
      actions={
        canCreateTeam ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg transition-[transform,opacity] enabled:hover:opacity-90 enabled:active:scale-[0.98]"
          >
            <Plus weight="bold" className="size-4" />
            Create team
          </button>
        ) : null
      }
    >
      {teams.length === 0 ? (
        <div className="flex flex-col items-start rounded-[10px] border border-dashed border-line bg-surface px-6 py-14 shadow-[var(--shadow-soft)] sm:items-center sm:text-center">
          <UsersThree weight="duotone" className="size-9 text-ink-faint" />
          <p className="mt-4 font-display text-lg tracking-[-0.03em] text-ink">
            No teams in {workspace.name}
          </p>
          <p className="mt-1 max-w-[40ch] text-sm text-ink-muted">
            {canCreateTeam
              ? "Create a team to group people for projects and ownership."
              : "Ask an organization owner to create the first team."}
          </p>
          {canCreateTeam ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg transition-[transform,opacity] enabled:hover:opacity-90 enabled:active:scale-[0.98]"
            >
              <Plus weight="bold" className="size-4" />
              Create team
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Teams"
            className="flex gap-1 overflow-x-auto rounded-[10px] border border-line bg-surface p-1 shadow-[var(--shadow-soft)] scrollbar-none"
          >
            {teams.map((team) => {
              const active = selected?.id === team.id;
              return (
                <button
                  key={team.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={cn(
                    "relative shrink-0 rounded-[8px] px-3 py-2 text-sm transition-[colors,transform] enabled:active:scale-[0.98]",
                    active
                      ? "bg-brand-soft font-medium text-ink"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {team.name}
                </button>
              );
            })}
          </div>

          {selected ? (
            <div className="mt-8 space-y-6">
              <div>
                <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                  {selected.name}
                </h2>
                <p className="mt-0.5 font-mono text-xs text-ink-faint">
                  /{selected.slug}
                  {selected.myRole ? (
                    <span className="ml-2 uppercase tracking-wider">
                      your role {selected.myRole}
                    </span>
                  ) : null}
                </p>
              </div>

              <TeamMembersPanel
                teamId={selected.id}
                workspaceId={workspace.id}
                canManage={
                  canOrgAdmin ||
                  selected.myRole === "OWNER" ||
                  selected.myRole === "ADMIN"
                }
                myRole={selected.myRole}
                currentUserId={session?.user?.id}
                isOrgOwner={org.myRole === "OWNER"}
              />
            </div>
          ) : null}
        </>
      )}

      <CreateTeamModal
        open={createOpen}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        onClose={() => setCreateOpen(false)}
        onCreated={(team) => {
          if (team.id) setSelectedTeamId(team.id);
        }}
      />
    </AppPageShell>
  );
}
