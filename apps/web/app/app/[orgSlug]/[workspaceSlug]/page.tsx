"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MY_ORGANIZATIONS,
  RESTORE_WORKSPACE,
  WORKSPACE,
  type MyOrganizationsQuery,
  type WorkspaceQuery,
} from "@/features/organizations/graphql/operations";
import { WorkspaceHome } from "@/features/workspaces/components/workspace-home";
import { ConfirmDialog } from "@/features/app/components/confirm-dialog";
import { AppPageShell } from "@/features/app/components/app-page-shell";
import { useTenancyStore } from "@/features/tenancy/store/workspace-context";

export default function WorkspacePage() {
  const params = useParams<{ orgSlug: string; workspaceSlug: string }>();
  const setActiveWorkspace = useTenancyStore((s) => s.setActiveWorkspace);
  const [restoreOpen, setRestoreOpen] = useState(false);

  const { data: orgData } = useQuery<MyOrganizationsQuery>(MY_ORGANIZATIONS);
  const org = orgData?.myOrganizations?.find(
    (o) => o.slug === params.orgSlug,
  );
  const canAdmin = org?.myRole === "OWNER" || org?.myRole === "ADMIN";

  const { data, loading, error, refetch } = useQuery<WorkspaceQuery>(WORKSPACE, {
    variables: {
      orgSlug: params.orgSlug,
      workspaceSlug: params.workspaceSlug,
    },
    skip: !params.orgSlug || !params.workspaceSlug,
  });

  const [restoreWorkspace, { loading: restoring }] = useMutation(
    RESTORE_WORKSPACE,
    {
      refetchQueries: ["MyWorkspaces"],
      awaitRefetchQueries: true,
    },
  );

  useEffect(() => {
    const ws = data?.workspace;
    if (ws && !ws.archivedAt) {
      setActiveWorkspace({
        id: ws.id,
        slug: ws.slug,
        orgSlug: ws.orgSlug,
        organizationId: ws.organizationId,
      });
    }
  }, [data, setActiveWorkspace]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-[10px] bg-line" />
        <div className="h-48 animate-pulse rounded-[10px] bg-line" />
      </div>
    );
  }

  if (error || !data?.workspace) {
    return (
      <p className="text-ink-muted">
        Workspace not found or you don&apos;t have access.
      </p>
    );
  }

  const ws = data.workspace;

  if (ws.archivedAt) {
    return (
      <>
        <AppPageShell
          accent="chat"
          meta="Archived"
          title={ws.name}
          description={
            <>
              This workspace is read-only. Teams and invites cannot change until
              an organization admin restores it. Archive and restore are logged
              in Audit.
            </>
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/app/${params.orgSlug}/workspaces`}
                className="rounded-[10px] border border-line bg-surface px-3 py-2 text-sm text-ink transition-[transform,colors] hover:bg-canvas enabled:active:scale-[0.98]"
              >
                Back to workspaces
              </Link>
              {canAdmin ? (
                <button
                  type="button"
                  onClick={() => setRestoreOpen(true)}
                  className="rounded-[10px] bg-accent px-3 py-2 text-sm font-semibold text-accent-fg transition-[transform,opacity] enabled:active:scale-[0.98]"
                >
                  Restore workspace
                </button>
              ) : null}
            </div>
          }
        >
          <div className="mx-auto max-w-xl rounded-[10px] border border-dashed border-line bg-surface/70 p-6 text-sm text-ink-muted">
            Sidebar entries for this space are hidden while archived. Restoring
            brings it back for every member.
          </div>
        </AppPageShell>

        <ConfirmDialog
          open={restoreOpen}
          title="Restore this workspace?"
          tone="neutral"
          description={
            <p>
              <span className="font-medium text-ink">{ws.name}</span> will
              return to the sidebar and become writable again. This is logged
              in Audit with your name and the time.
            </p>
          }
          confirmLabel="Restore workspace"
          loading={restoring}
          onCancel={() => {
            if (!restoring) setRestoreOpen(false);
          }}
          onConfirm={async () => {
            try {
              await restoreWorkspace({
                variables: { input: { workspaceId: ws.id } },
              });
              setRestoreOpen(false);
              await refetch();
            } catch {
              /* keep open */
            }
          }}
        />
      </>
    );
  }

  return (
    <WorkspaceHome
      workspaceName={ws.name}
      orgName={org?.name ?? params.orgSlug}
    />
  );
}
