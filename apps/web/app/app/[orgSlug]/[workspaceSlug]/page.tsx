"use client";

import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import {
  MY_ORGANIZATIONS,
  WORKSPACE,
  type MyOrganizationsQuery,
  type WorkspaceQuery,
} from "@/features/organizations/graphql/operations";
import { WorkspaceHome } from "@/features/workspaces/components/workspace-home";
import { useTenancyStore } from "@/features/tenancy/store/workspace-context";

export default function WorkspacePage() {
  const params = useParams<{ orgSlug: string; workspaceSlug: string }>();
  const setActiveWorkspace = useTenancyStore((s) => s.setActiveWorkspace);

  const { data: orgData } = useQuery<MyOrganizationsQuery>(MY_ORGANIZATIONS);
  const org = orgData?.myOrganizations?.find(
    (o) => o.slug === params.orgSlug,
  );

  const { data, loading, error } = useQuery<WorkspaceQuery>(WORKSPACE, {
    variables: {
      orgSlug: params.orgSlug,
      workspaceSlug: params.workspaceSlug,
    },
    skip: !params.orgSlug || !params.workspaceSlug,
  });

  useEffect(() => {
    const ws = data?.workspace;
    if (ws) {
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
      <div className="flex justify-center py-20 text-ink-muted">
        <CircleNotch weight="bold" className="size-5 animate-spin text-brand" />
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

  return (
    <WorkspaceHome
      workspaceName={data.workspace.name}
      orgName={org?.name ?? params.orgSlug}
    />
  );
}
