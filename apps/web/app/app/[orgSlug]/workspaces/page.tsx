"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { Archive, ArrowRight } from "@phosphor-icons/react";
import { useState } from "react";
import {
  ARCHIVE_WORKSPACE,
  MY_ORGANIZATIONS,
  MY_WORKSPACES,
  RESTORE_WORKSPACE,
  type MyOrganizationsQuery,
  type MyWorkspacesQuery,
  type WorkspaceSummary,
} from "@/features/organizations/graphql/operations";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import { ConfirmDialog } from "@/features/app/components/confirm-dialog";
import {
  AppPageShell,
  WorkspaceMonogram,
} from "@/features/app/components/app-page-shell";
import { useTenancyStore } from "@/features/tenancy/store/workspace-context";

const WORKSPACE_REFETCH = "MyWorkspaces";

export default function OrgWorkspacesPage() {
  const params = useParams<{ orgSlug: string }>();
  const router = useRouter();
  const setActiveWorkspace = useTenancyStore((s) => s.setActiveWorkspace);
  const [pendingArchive, setPendingArchive] = useState<WorkspaceSummary | null>(
    null,
  );
  const [pendingRestore, setPendingRestore] = useState<WorkspaceSummary | null>(
    null,
  );

  const { data: orgData, loading: orgLoading } =
    useQuery<MyOrganizationsQuery>(MY_ORGANIZATIONS);
  const org = orgData?.myOrganizations?.find((o) => o.slug === params.orgSlug);
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

  const [archiveWorkspace, { loading: archiving }] = useMutation(
    ARCHIVE_WORKSPACE,
    { refetchQueries: [WORKSPACE_REFETCH], awaitRefetchQueries: true },
  );
  const [restoreWorkspace, { loading: restoring }] = useMutation(
    RESTORE_WORKSPACE,
    { refetchQueries: [WORKSPACE_REFETCH], awaitRefetchQueries: true },
  );

  const workspaces = wsData?.myWorkspaces ?? [];
  const active = workspaces.filter((w) => !w.archivedAt);
  const archived = workspaces.filter((w) => w.archivedAt);

  async function confirmArchive() {
    if (!pendingArchive) return;
    const workspaceId = pendingArchive.id;
    try {
      await archiveWorkspace({
        variables: { input: { workspaceId } },
      });
      const store = useTenancyStore.getState();
      if (
        store.activeWorkspaceId === workspaceId ||
        store.activeWorkspaceSlug === pendingArchive.slug
      ) {
        useTenancyStore.setState({
          activeWorkspaceId: null,
          activeWorkspaceSlug: null,
        });
      }
      setPendingArchive(null);
    } catch {
      /* keep dialog open */
    }
  }

  async function confirmRestore() {
    if (!pendingRestore) return;
    try {
      await restoreWorkspace({
        variables: { input: { workspaceId: pendingRestore.id } },
      });
      setPendingRestore(null);
    } catch {
      /* keep dialog open */
    }
  }

  function openWorkspace(ws: WorkspaceSummary) {
    setActiveWorkspace({
      id: ws.id,
      slug: ws.slug,
      orgSlug: ws.orgSlug,
      organizationId: ws.organizationId,
    });
    router.push(`/app/${ws.orgSlug}/${ws.slug}`);
  }

  if (orgLoading || (org && wsLoading)) {
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

  return (
    <AppPageShell
      accent="work"
      title="Workspaces"
      description={
        <>
          Spaces inside {org.name}. Archive keeps the data and removes the
          space from the sidebar until you restore it. Both actions land in
          Audit.
        </>
      }
    >
      {active.length === 0 && archived.length === 0 ? (
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-8">
            <h2 className="font-display text-2xl tracking-[-0.04em] text-ink">
              Org, workspace, then team
            </h2>
            <div className="relative space-y-0 border-l border-line pl-6">
              {[
                {
                  title: "Organization",
                  body: `Members and invites for ${org.name}.`,
                },
                {
                  title: "Workspace",
                  body: "A product space you create or join. Nothing is auto-created.",
                },
                {
                  title: "Team",
                  body: "A group inside a workspace for ownership and assignment.",
                },
              ].map((step) => (
                <div key={step.title} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[1.9rem] top-1.5 size-2.5 rounded-full bg-lane-work ring-4 ring-canvas" />
                  <p className="font-medium text-ink">{step.title}</p>
                  <p className="mt-1 max-w-[42ch] text-sm text-ink-muted">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[10px] border border-line bg-surface p-6 shadow-[var(--shadow-soft)]">
            {canAdmin ? (
              <>
                <h3 className="font-display text-lg tracking-[-0.03em] text-ink">
                  Create a workspace
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  You become its owner and can invite others later.
                </p>
                <div className="mt-5">
                  <CreateWorkspaceForm
                    organizationId={org.id}
                    orgSlug={org.slug}
                    onCreated={(ws) => {
                      setActiveWorkspace({
                        id: ws.id,
                        slug: ws.slug,
                        orgSlug: ws.orgSlug,
                        organizationId: org.id,
                      });
                      router.push(`/app/${ws.orgSlug}/${ws.slug}`);
                    }}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-muted">
                Ask an organization admin to invite you to a workspace.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl space-y-12">
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                Active
              </h2>
              <span className="font-mono text-[11px] text-ink-faint">
                {active.length} open
              </span>
            </div>
            {active.length === 0 ? (
              <p className="rounded-[10px] border border-dashed border-line bg-surface/60 px-5 py-8 text-sm text-ink-muted">
                No active workspaces. Restore one below or create a new one.
              </p>
            ) : (
              <ul className="grid gap-3">
                {active.map((ws) => (
                  <li
                    key={ws.id}
                    className="group flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-surface p-3 shadow-[var(--shadow-soft)] transition-[border-color,transform] hover:border-line-strong"
                  >
                    <button
                      type="button"
                      onClick={() => openWorkspace(ws)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-[8px] px-1 py-1 text-left transition-colors"
                    >
                      <WorkspaceMonogram name={ws.name} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink group-hover:text-brand">
                          {ws.name}
                        </span>
                        <span className="font-mono text-[11px] text-ink-faint">
                          /{ws.slug}
                        </span>
                      </span>
                      <ArrowRight
                        weight="bold"
                        className="ml-auto size-4 shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </button>
                    {canAdmin ? (
                      <button
                        type="button"
                        onClick={() => setPendingArchive(ws)}
                        className="inline-flex items-center gap-1.5 rounded-[10px] border border-line px-3 py-2 text-xs font-medium text-ink-muted transition-[transform,colors] hover:border-line-strong hover:text-ink enabled:active:scale-[0.98]"
                      >
                        <Archive weight="bold" className="size-3.5" />
                        Archive
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {archived.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
                  Archived
                </h2>
                <span className="font-mono text-[11px] text-ink-faint">
                  {archived.length} parked
                </span>
              </div>
              <ul className="grid gap-3">
                {archived.map((ws) => (
                  <li
                    key={ws.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-dashed border-line bg-canvas/80 px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <WorkspaceMonogram name={ws.name} muted />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink-muted">
                          {ws.name}
                        </p>
                        <p className="font-mono text-[11px] text-ink-faint">
                          /{ws.slug}
                        </p>
                      </div>
                    </div>
                    {canAdmin ? (
                      <button
                        type="button"
                        onClick={() => setPendingRestore(ws)}
                        className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-3 py-2 text-xs font-semibold text-accent-fg transition-[transform,opacity] enabled:active:scale-[0.98]"
                      >
                        Restore
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {canAdmin ? (
            <section className="overflow-hidden rounded-[10px] border border-line bg-surface shadow-[var(--shadow-soft)]">
              <div className="border-b border-line bg-gradient-to-r from-lane-work/10 to-transparent px-5 py-4">
                <h2 className="font-display text-lg tracking-[-0.03em] text-ink">
                  Add workspace
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Creates an active space and adds you as a member.
                </p>
              </div>
              <div className="max-w-md p-5">
                <CreateWorkspaceForm
                  organizationId={org.id}
                  orgSlug={org.slug}
                  onCreated={(ws) => {
                    setActiveWorkspace({
                      id: ws.id,
                      slug: ws.slug,
                      orgSlug: ws.orgSlug,
                      organizationId: org.id,
                    });
                    router.push(`/app/${ws.orgSlug}/${ws.slug}`);
                  }}
                />
              </div>
            </section>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingArchive)}
        title="Archive this workspace?"
        description={
          pendingArchive ? (
            <p>
              <span className="font-medium text-ink">{pendingArchive.name}</span>{" "}
              will leave the sidebar and become read-only. Teams and invites
              cannot change until you restore it. This is logged in Audit with
              your name and the time.
            </p>
          ) : null
        }
        confirmLabel="Archive workspace"
        loading={archiving}
        onCancel={() => {
          if (!archiving) setPendingArchive(null);
        }}
        onConfirm={() => void confirmArchive()}
      />

      <ConfirmDialog
        open={Boolean(pendingRestore)}
        title="Restore this workspace?"
        tone="neutral"
        description={
          pendingRestore ? (
            <p>
              <span className="font-medium text-ink">{pendingRestore.name}</span>{" "}
              will return to the sidebar and become writable again. This is
              logged in Audit with your name and the time.
            </p>
          ) : null
        }
        confirmLabel="Restore workspace"
        loading={restoring}
        onCancel={() => {
          if (!restoring) setPendingRestore(null);
        }}
        onConfirm={() => void confirmRestore()}
      />
    </AppPageShell>
  );
}
