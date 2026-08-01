"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type TenancyState = {
  activeOrganizationId: string | null;
  activeWorkspaceId: string | null;
  activeOrgSlug: string | null;
  activeWorkspaceSlug: string | null;
  setActiveOrg: (org: {
    id: string;
    slug: string;
  }) => void;
  setActiveWorkspace: (workspace: {
    id: string;
    slug: string;
    orgSlug: string;
    organizationId: string;
  }) => void;
  clear: () => void;
};

export const useTenancyStore = create<TenancyState>()(
  persist(
    (set) => ({
      activeOrganizationId: null,
      activeWorkspaceId: null,
      activeOrgSlug: null,
      activeWorkspaceSlug: null,
      setActiveOrg: (org) =>
        set({
          activeOrganizationId: org.id,
          activeOrgSlug: org.slug,
        }),
      setActiveWorkspace: (workspace) =>
        set({
          activeOrganizationId: workspace.organizationId,
          activeWorkspaceId: workspace.id,
          activeOrgSlug: workspace.orgSlug,
          activeWorkspaceSlug: workspace.slug,
        }),
      clear: () =>
        set({
          activeOrganizationId: null,
          activeWorkspaceId: null,
          activeOrgSlug: null,
          activeWorkspaceSlug: null,
        }),
    }),
    { name: "craftr-tenancy" },
  ),
);
