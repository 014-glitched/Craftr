"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import {
  MY_ORGANIZATIONS,
  MY_WORKSPACES,
  type MyOrganizationsQuery,
  type MyWorkspacesQuery,
} from "@/features/organizations/graphql/operations";
import {
  AUDIT_ACTION_LABELS,
  ORGANIZATION_AUDIT_LOGS,
  WORKSPACE_AUDIT_LOGS,
  type OrganizationAuditLogsQuery,
  type WorkspaceAuditLogsQuery,
} from "@/features/audit/graphql/operations";
import { AppPageShell } from "@/features/app/components/app-page-shell";
import { useTenancyStore } from "@/features/tenancy/store/workspace-context";
import { cn } from "@/lib/utils";

function formatTimestamp(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function OrgAuditPage() {
  const params = useParams<{ orgSlug: string }>();
  const activeWorkspaceSlug = useTenancyStore((s) => s.activeWorkspaceSlug);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const { data: orgData, loading: orgLoading } =
    useQuery<MyOrganizationsQuery>(MY_ORGANIZATIONS);
  const org = orgData?.myOrganizations?.find((o) => o.slug === params.orgSlug);
  const canViewOrgAudit =
    org?.myRole === "OWNER" || org?.myRole === "ADMIN";

  const { data: wsData, loading: wsLoading } = useQuery<MyWorkspacesQuery>(
    MY_WORKSPACES,
    {
      variables: { organizationId: org?.id ?? "", includeArchived: true },
      skip: !org?.id,
    },
  );

  const workspaces = wsData?.myWorkspaces ?? [];
  const activeWorkspaces = workspaces.filter((w) => !w.archivedAt);

  useEffect(() => {
    if (canViewOrgAudit || workspaces.length === 0 || workspaceId) return;
    const preferred =
      activeWorkspaces.find((w) => w.slug === activeWorkspaceSlug) ??
      workspaces.find((w) => w.slug === activeWorkspaceSlug) ??
      activeWorkspaces[0] ??
      workspaces[0];
    if (preferred) setWorkspaceId(preferred.id);
  }, [
    canViewOrgAudit,
    workspaces,
    activeWorkspaces,
    workspaceId,
    activeWorkspaceSlug,
  ]);

  const workspace =
    workspaces.find((w) => w.id === workspaceId) ??
    activeWorkspaces[0] ??
    workspaces[0] ??
    null;
  const isWorkspaceOwner = workspace?.myRole === "OWNER";

  const workspaceById = useMemo(() => {
    const map = new Map<string, { name: string; archivedAt?: string | null }>();
    for (const w of workspaces) {
      map.set(w.id, { name: w.name, archivedAt: w.archivedAt });
    }
    return map;
  }, [workspaces]);

  const {
    data: orgLogsData,
    loading: orgLogsLoading,
    error: orgLogsError,
  } = useQuery<OrganizationAuditLogsQuery>(ORGANIZATION_AUDIT_LOGS, {
    variables: { organizationId: org?.id ?? "", limit: 50 },
    skip: !org?.id || !canViewOrgAudit,
  });

  const {
    data: wsLogsData,
    loading: wsLogsLoading,
    error: wsLogsError,
  } = useQuery<WorkspaceAuditLogsQuery>(WORKSPACE_AUDIT_LOGS, {
    variables: { workspaceId: workspace?.id ?? "", limit: 50 },
    skip: !workspace?.id || canViewOrgAudit || !isWorkspaceOwner,
  });

  const logs = canViewOrgAudit
    ? (orgLogsData?.organizationAuditLogs ?? [])
    : (wsLogsData?.workspaceAuditLogs ?? []);
  const logsLoading = canViewOrgAudit ? orgLogsLoading : wsLogsLoading;
  const logsError = canViewOrgAudit ? orgLogsError : wsLogsError;

  if (orgLoading || wsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-[10px] bg-line" />
        <div className="h-40 animate-pulse rounded-[10px] bg-line" />
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

  if (!canViewOrgAudit && !workspace) {
    return (
      <p className="text-ink-muted">
        No workspaces yet.{" "}
        <Link
          href={`/app/${params.orgSlug}/workspaces`}
          className="text-brand hover:underline"
        >
          Create a workspace
        </Link>{" "}
        first.
      </p>
    );
  }

  const canRead =
    canViewOrgAudit || (workspace != null && isWorkspaceOwner);

  return (
    <AppPageShell
      accent="chat"
      title="Audit logs"
      description={
        canViewOrgAudit ? (
          <>
            Append-only trail for{" "}
            <span className="font-medium text-ink">{org.name}</span>
            , including archived workspaces. Organization owners and admins.
          </>
        ) : (
          <>
            Append-only trail for{" "}
            {workspaces.length > 1 ? (
              <label className="inline-flex items-center gap-1.5">
                <span className="sr-only">Workspace</span>
                <select
                  value={workspace?.id ?? ""}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  className="cursor-pointer border-0 bg-transparent p-0 font-medium text-ink outline-none"
                >
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                      {w.archivedAt ? " (archived)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="font-medium text-ink">
                {workspace?.name}
                {workspace?.archivedAt ? " (archived)" : ""}
              </span>
            )}
            . Workspace owners only.
          </>
        )
      }
    >
      {!canRead ? (
        <p className="rounded-[10px] border border-line bg-surface px-5 py-8 text-sm text-ink-muted shadow-(--shadow-soft)">
          {canViewOrgAudit
            ? "Only organization owners and admins can view audit logs."
            : "Only workspace owners can view audit logs."}
        </p>
      ) : logsLoading ? (
        <div className="h-32 animate-pulse rounded-[10px] bg-line" />
      ) : logsError ? (
        <p className="text-sm text-ink-muted">
          Could not load audit logs. You may not have permission.
        </p>
      ) : logs.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-line bg-surface px-5 py-8 text-sm text-ink-muted">
          No audit events yet.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-[10px] border border-line bg-surface shadow-(--shadow-soft)">
          {logs.map((log, i) => {
            const scope =
              log.workspaceId == null
                ? "org-wide"
                : workspaceById.get(log.workspaceId);
            return (
              <li
                key={log.id}
                className={cn(
                  "flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
                  i > 0 && "border-t border-line",
                )}
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-ink">
                    {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                    {scope === "org-wide" ? (
                      <span className="ml-2 font-normal text-ink-faint">
                        org-wide
                      </span>
                    ) : scope ? (
                      <span className="ml-2 font-normal text-ink-faint">
                        {scope.name}
                        {scope.archivedAt ? " (archived)" : ""}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-ink-muted">{log.summary}</p>
                  <p className="text-xs text-ink-faint">
                    {log.actor.name}
                    <span className="mx-1.5">-</span>
                    {log.actor.email}
                  </p>
                </div>
                <time
                  dateTime={log.createdAt}
                  className="shrink-0 font-mono text-xs text-ink-faint"
                >
                  {formatTimestamp(log.createdAt)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </AppPageShell>
  );
}
