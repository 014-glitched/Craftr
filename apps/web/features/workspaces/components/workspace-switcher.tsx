"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import {
  GearSix,
  Scroll,
  SquaresFour,
} from "@phosphor-icons/react";
import {
  MY_ORGANIZATIONS,
  MY_WORKSPACES,
  type MyOrganizationsQuery,
  type MyWorkspacesQuery,
} from "@/features/organizations/graphql/operations";
import { useTenancyStore } from "@/features/tenancy/store/workspace-context";
import { cn } from "@/lib/utils";
import { SidebarAccordion } from "@/features/app/components/sidebar-accordion";

const RESERVED_ORG_SEGMENTS = new Set([
  "settings",
  "teams",
  "audit",
  "workspaces",
]);

export function WorkspaceSwitcher({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeWorkspaceSlug, setActiveWorkspace } = useTenancyStore();

  const { data: orgData } = useQuery<MyOrganizationsQuery>(MY_ORGANIZATIONS);
  const org = orgData?.myOrganizations?.find((o) => o.slug === orgSlug);

  const { data: wsData } = useQuery<MyWorkspacesQuery>(MY_WORKSPACES, {
    variables: { organizationId: org?.id ?? "", includeArchived: false },
    skip: !org?.id,
  });

  const workspaces = (wsData?.myWorkspaces ?? []).filter((w) => !w.archivedAt);
  const workspacesHref = `/app/${orgSlug}/workspaces`;
  const onWorkspacesPage = pathname === workspacesHref;
  const pathSeg = pathname.match(new RegExp(`^/app/${orgSlug}/([^/]+)$`))?.[1];
  const onWorkspaceRoute = Boolean(
    pathSeg && !RESERVED_ORG_SEGMENTS.has(pathSeg),
  );

  if (!org) return null;

  return (
    <SidebarAccordion
      title="Workspaces"
      defaultOpen={onWorkspaceRoute || onWorkspacesPage || workspaces.length > 0}
    >
      <ul className="space-y-0.5">
        {workspaces.map((ws) => {
          const active =
            ws.slug === activeWorkspaceSlug ||
            pathname === `/app/${ws.orgSlug}/${ws.slug}`;
          return (
            <li key={ws.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveWorkspace({
                    id: ws.id,
                    slug: ws.slug,
                    orgSlug: ws.orgSlug,
                    organizationId: ws.organizationId,
                  });
                  router.push(`/app/${ws.orgSlug}/${ws.slug}`);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-brand-soft font-medium text-ink"
                    : "text-ink-muted hover:bg-canvas hover:text-ink",
                )}
              >
                <span className="size-1.5 shrink-0 rounded-full bg-lane-work" />
                <span className="truncate">{ws.name}</span>
              </button>
            </li>
          );
        })}
        {workspaces.length === 0 ? (
          <li>
            <Link
              href={workspacesHref}
              className={cn(
                "block rounded-lg px-2.5 py-2 text-sm transition-colors",
                onWorkspacesPage
                  ? "bg-brand-soft font-medium text-ink"
                  : "text-ink-muted hover:bg-canvas hover:text-ink",
              )}
            >
              How workspaces work
            </Link>
          </li>
        ) : (
          <li>
            <Link
              href={workspacesHref}
              className={cn(
                "block rounded-lg px-2.5 py-2 text-xs transition-colors",
                onWorkspacesPage
                  ? "font-medium text-ink"
                  : "text-ink-faint hover:text-ink-muted",
              )}
            >
              Manage workspaces
            </Link>
          </li>
        )}
      </ul>
    </SidebarAccordion>
  );
}

export function OrgNav({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  const settingsHref = `/app/${orgSlug}/settings`;
  const auditHref = `/app/${orgSlug}/audit`;
  const settingsActive = pathname === settingsHref;
  const auditActive = pathname === auditHref;
  const orgSectionOpen = settingsActive || auditActive;

  return (
    <SidebarAccordion title="Organization" defaultOpen={orgSectionOpen}>
      <Link
        href={settingsHref}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
          settingsActive
            ? "bg-brand-soft font-medium text-ink"
            : "text-ink-muted hover:bg-canvas hover:text-ink",
        )}
      >
        <GearSix weight="bold" className="size-4 shrink-0 text-brand" />
        <span>Settings & members</span>
      </Link>
      <Link
        href={auditHref}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
          auditActive
            ? "bg-brand-soft font-medium text-ink"
            : "text-ink-muted hover:bg-canvas hover:text-ink",
        )}
      >
        <Scroll weight="bold" className="size-4 shrink-0 text-brand" />
        <span>Audit</span>
      </Link>
    </SidebarAccordion>
  );
}

export function LaneNavPlaceholder() {
  return (
    <SidebarAccordion title="Lanes" defaultOpen={false}>
      <ul className="space-y-0.5">
        {[
          { label: "Work", color: "bg-lane-work", hint: "Projects & tasks" },
          { label: "Context", color: "bg-lane-docs", hint: "Docs & files" },
          { label: "Signal", color: "bg-lane-chat", hint: "Chat & alerts" },
        ].map((lane) => (
          <li key={lane.label}>
            <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-faint">
              <span className={`size-1.5 shrink-0 rounded-full ${lane.color}`} />
              <span className="min-w-0 flex-1 truncate">{lane.label}</span>
              <span className="truncate font-mono text-[10px]">{lane.hint}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-1 px-2.5 pb-1 text-[11px] text-ink-faint">
        Coming in later phases
      </p>
    </SidebarAccordion>
  );
}

export function OrgSwitcher() {
  const router = useRouter();
  const { activeOrgSlug, setActiveOrg } = useTenancyStore();
  const { data } = useQuery<MyOrganizationsQuery>(MY_ORGANIZATIONS);
  const orgs = data?.myOrganizations ?? [];

  if (orgs.length <= 1) {
    const org = orgs[0];
    if (!org) return null;
    return (
      <p className="truncate text-sm font-medium text-ink">{org.name}</p>
    );
  }

  return (
    <select
      value={activeOrgSlug ?? orgs[0]?.slug ?? ""}
      onChange={(e) => {
        const org = orgs.find((o) => o.slug === e.target.value);
        if (!org) return;
        setActiveOrg({ id: org.id, slug: org.slug });
        router.push("/app");
      }}
      className="w-full rounded-lg border border-line-strong bg-canvas px-2.5 py-2 text-sm text-ink outline-none focus:border-brand"
    >
      {orgs.map((org) => (
        <option key={org.id} value={org.slug}>
          {org.name}
        </option>
      ))}
    </select>
  );
}

export function HomeNavLink({ href, active }: { href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "mx-2 mb-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-brand-soft text-ink"
          : "text-ink-muted hover:bg-canvas hover:text-ink",
      )}
    >
      <SquaresFour weight="bold" className="size-4 text-brand" />
      Home
    </Link>
  );
}
