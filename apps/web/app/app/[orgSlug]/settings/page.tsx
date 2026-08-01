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
    },
  );

  if (orgLoading) {
    return (
      <div className="flex justify-center py-20">
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
    <div className="mx-auto max-w-2xl animate-auth-rise space-y-10">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Organization
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-[-0.04em]">
          {org.name}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">/{org.slug}</p>
      </div>

      {canAdmin ? (
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-lg tracking-[-0.03em]">Invite members</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Create a link to share — email delivery comes in a later phase.
          </p>
          <div className="mt-4">
            <InviteMemberForm organizationId={org.id} />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-lg tracking-[-0.03em]">Members</h2>
        {membersLoading ? (
          <CircleNotch weight="bold" className="mt-4 size-5 animate-spin text-brand" />
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">{m.user.name}</p>
                  <p className="text-ink-faint">{m.user.email}</p>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canAdmin ? (
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-lg tracking-[-0.03em]">Workspaces</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Add another workspace under this organization.
          </p>
          <div className="mt-4">
            <CreateWorkspaceForm
              organizationId={org.id}
              orgSlug={org.slug}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
