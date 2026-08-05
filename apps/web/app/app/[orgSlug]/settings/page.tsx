"use client";

import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import {
  MY_ORGANIZATIONS,
  ORGANIZATION_MEMBERS,
  type MyOrganizationsQuery,
  type OrganizationMembersQuery,
} from "@/features/organizations/graphql/operations";
import { InviteMemberForm } from "@/features/organizations/components/invite-member-form";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";

export default function OrgSettingsPage() {
  const params = useParams<{ orgSlug: string }>();

  const { data: orgData, loading: orgLoading } =
    useQuery<MyOrganizationsQuery>(MY_ORGANIZATIONS);
  const org = orgData?.myOrganizations?.find(
    (o) => o.slug === params.orgSlug,
  );

  const { data: membersData, loading: membersLoading } = useQuery<
    OrganizationMembersQuery
  >(ORGANIZATION_MEMBERS, {
    variables: { organizationId: org?.id ?? "" },
    skip: !org?.id,
  });

  if (orgLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <CircleNotch weight="bold" className="size-5 animate-spin text-brand" />
      </div>
    );
  }

  if (!org) {
    return <p className="text-ink-muted">Organization not found.</p>;
  }

  const members = membersData?.organizationMembers ?? [];
  const canAdmin = org.myRole === "OWNER" || org.myRole === "ADMIN";

  return (
    <div className="-mx-6 -my-6 flex min-h-[calc(100dvh-3.5rem)] flex-col md:-mx-10 md:-my-10">
      <header className="border-b border-line bg-surface px-6 py-6 md:px-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Organization
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-[-0.04em] text-ink md:text-4xl">
          {org.name}
        </h1>
        <p className="mt-1 font-mono text-sm text-ink-muted">/{org.slug}</p>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="border-b border-line px-6 py-8 md:px-10 lg:border-b-0 lg:border-r">
          <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
            Members
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Everyone with access to this organization.
          </p>

          {membersLoading ? (
            <CircleNotch
              weight="bold"
              className="mt-6 size-5 animate-spin text-brand"
            />
          ) : (
            <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {m.user.name}
                    </p>
                    <p className="truncate text-ink-faint">{m.user.email}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                    {m.role}
                  </span>
                </li>
              ))}
              {members.length === 0 ? (
                <li className="px-4 py-8 text-sm text-ink-faint">
                  No members yet.
                </li>
              ) : null}
            </ul>
          )}

          {canAdmin ? (
            <div className="mt-8 border-t border-line pt-8">
              <h3 className="font-display text-lg tracking-[-0.03em]">
                Invite members
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                Create a link to share — email delivery comes later.
              </p>
              <div className="mt-4 max-w-lg">
                <InviteMemberForm organizationId={org.id} />
              </div>
            </div>
          ) : null}
        </section>

        <section className="bg-canvas px-6 py-8 md:px-10">
          <h2 className="font-display text-xl tracking-[-0.03em] text-ink">
            Workspaces
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Spaces under this organization. Create them when you need them.
          </p>
          {canAdmin ? (
            <div className="mt-6 max-w-md rounded-xl border border-line bg-surface p-5">
              <h3 className="text-sm font-medium text-ink">Add workspace</h3>
              <div className="mt-4">
                <CreateWorkspaceForm
                  organizationId={org.id}
                  orgSlug={org.slug}
                />
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-ink-faint">
              Only organization admins can create workspaces.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
