"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { FormEvent, useMemo, useState } from "react";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import {
  ADD_TEAM_MEMBER,
  CANCEL_TEAM_OWNERSHIP_CHANGE,
  CREATE_TEAM_OWNERSHIP_CHANGE,
  REMOVE_TEAM_MEMBER,
  RESPOND_TEAM_OWNERSHIP_CHANGE,
  TEAM_MEMBERS,
  TEAM_OWNERSHIP_CHANGES,
  WORKSPACE_MEMBERS,
  WORKSPACE_TEAMS,
  type AddTeamMemberMutation,
  type CancelTeamOwnershipChangeMutation,
  type CreateTeamOwnershipChangeMutation,
  type OwnershipChangeRow,
  type RemoveTeamMemberMutation,
  type RespondTeamOwnershipChangeMutation,
  type TeamMembersQuery,
  type WorkspaceMembersQuery,
  type TeamOwnershipChangesQuery,
} from "@/features/teams/graphql/operations";
import { apolloErrorMessage } from "@/lib/apollo-errors";
import { useSession } from "@/lib/auth-client";

export function TeamMembersPanel({
  teamId,
  workspaceId,
  canManage,
  myRole,
  currentUserId: currentUserIdProp,
  isOrgOwner = false,
}: {
  teamId: string;
  workspaceId: string;
  canManage: boolean;
  myRole?: string | null;
  currentUserId?: string | null;
  /** Org OWNER may approve team ownership REQUESTS even if not a team owner. */
  isOrgOwner?: boolean;
}) {
  const { data: session } = useSession();
  const currentUserId = currentUserIdProp ?? session?.user?.id ?? null;
  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{
    userId: string;
    name: string;
    isSelf: boolean;
  } | null>(null);

  const { data: membersData, loading: membersLoading, refetch } = useQuery<
    TeamMembersQuery
  >(TEAM_MEMBERS, {
    variables: { teamId },
  });

  const {
    data: changesData,
    loading: changesLoading,
    refetch: refetchChanges,
  } = useQuery<TeamOwnershipChangesQuery>(TEAM_OWNERSHIP_CHANGES, {
    variables: { teamId },
  });

  const { data: wsMembersData } = useQuery<WorkspaceMembersQuery>(
    WORKSPACE_MEMBERS,
    {
      variables: { workspaceId },
      skip: !canManage,
    },
  );

  const [addMember, { loading: adding }] =
    useMutation<AddTeamMemberMutation>(ADD_TEAM_MEMBER);
  const [removeMember, { loading: removing }] =
    useMutation<RemoveTeamMemberMutation>(REMOVE_TEAM_MEMBER);
  const [createChange, { loading: creatingChange }] =
    useMutation<CreateTeamOwnershipChangeMutation>(CREATE_TEAM_OWNERSHIP_CHANGE);
  const [respondChange, { loading: responding }] =
    useMutation<RespondTeamOwnershipChangeMutation>(
      RESPOND_TEAM_OWNERSHIP_CHANGE,
    );
  const [cancelChange, { loading: cancelling }] =
    useMutation<CancelTeamOwnershipChangeMutation>(CANCEL_TEAM_OWNERSHIP_CHANGE);

  const members = membersData?.teamMembers ?? [];
  const memberIds = useMemo(
    () => new Set(members.map((m) => m.user.id)),
    [members],
  );

  const candidates = (wsMembersData?.workspaceMembers ?? []).filter(
    (m) => !memberIds.has(m.user.id),
  );

  const pending = (changesData?.teamOwnershipChanges ?? []).filter(
    (c) => c.status === "PENDING",
  );

  // Prefer live membership over parent myRole (can be stale/null for org admins).
  const isOwner = useMemo(() => {
    if (!currentUserId) return myRole === "OWNER";
    return members.some(
      (m) => m.user.id === currentUserId && m.role === "OWNER",
    );
  }, [members, currentUserId, myRole]);

  const myMembership = useMemo(
    () => members.find((m) => m.user.id === currentUserId),
    [members, currentUserId],
  );

  const canRequestOwnership =
    Boolean(currentUserId) &&
    Boolean(myMembership) &&
    myMembership?.role !== "OWNER";

  async function refreshAll() {
    await Promise.all([
      refetch(),
      refetchChanges(),
      // Keep parent team.myRole in sync after ownership changes
    ]);
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) {
      setError("Select a workspace member to add.");
      return;
    }

    try {
      const result = await addMember({
        variables: {
          input: { teamId, userId, role: "MEMBER" },
        },
      });
      if (result.error) {
        setError(apolloErrorMessage(result.error, "Unable to add member."));
        return;
      }
      setUserId("");
      await refreshAll();
    } catch (err) {
      setError(apolloErrorMessage(err, "Unable to add member."));
    }
  }

  async function onConfirmRemove() {
    if (!confirmRemove) return;
    setError(null);
    try {
      const result = await removeMember({
        variables: {
          input: { teamId, userId: confirmRemove.userId },
        },
      });
      if (result.error) {
        setError(apolloErrorMessage(result.error, "Unable to remove member."));
        return;
      }
      setConfirmRemove(null);
      await refreshAll();
    } catch (err) {
      setError(apolloErrorMessage(err, "Unable to remove member."));
    }
  }

  async function onOffer(
    type: "TRANSFER" | "CO_OWNER",
    counterpartyUserId: string,
  ) {
    setError(null);
    try {
      const result = await createChange({
        variables: {
          input: { teamId, type, counterpartyUserId },
        },
      });
      if (result.error) {
        setError(
          apolloErrorMessage(result.error, "Unable to create ownership offer."),
        );
        return;
      }
      await refreshAll();
    } catch (err) {
      setError(apolloErrorMessage(err, "Unable to create ownership offer."));
    }
  }

  async function onRequest() {
    setError(null);
    try {
      const result = await createChange({
        variables: {
          input: { teamId, type: "REQUEST" },
        },
      });
      if (result.error) {
        setError(
          apolloErrorMessage(result.error, "Unable to request ownership."),
        );
        return;
      }
      await refreshAll();
    } catch (err) {
      setError(apolloErrorMessage(err, "Unable to request ownership."));
    }
  }

  async function onRespond(changeId: string, accept: boolean) {
    setError(null);
    try {
      const result = await respondChange({
        variables: { input: { changeId, accept } },
        refetchQueries: [
          { query: TEAM_MEMBERS, variables: { teamId } },
          { query: TEAM_OWNERSHIP_CHANGES, variables: { teamId } },
          { query: WORKSPACE_TEAMS, variables: { workspaceId } },
        ],
      });
      if (result.error) {
        setError(
          apolloErrorMessage(result.error, "Unable to respond to ownership change."),
        );
        return;
      }
      await refreshAll();
    } catch (err) {
      setError(
        apolloErrorMessage(err, "Unable to respond to ownership change."),
      );
    }
  }

  async function onCancel(changeId: string) {
    setError(null);
    try {
      const result = await cancelChange({
        variables: { input: { changeId } },
      });
      if (result.error) {
        setError(apolloErrorMessage(result.error, "Unable to cancel."));
        return;
      }
      await refreshAll();
    } catch (err) {
      setError(apolloErrorMessage(err, "Unable to cancel."));
    }
  }

  function changeLabel(c: OwnershipChangeRow) {
    if (c.type === "TRANSFER") {
      return `${c.initiator.name} offers to transfer ownership to ${c.counterparty?.name ?? "…"}`;
    }
    if (c.type === "CO_OWNER") {
      return `${c.initiator.name} invites ${c.counterparty?.name ?? "…"} as co-owner`;
    }
    return `${c.initiator.name} requests ownership`;
  }

  function canRespondTo(c: OwnershipChangeRow) {
    if (!currentUserId) return false;
    if (c.type === "REQUEST") {
      // Team OWNER or org OWNER (except the requester) can accept/decline
      return (
        (isOwner || isOrgOwner) && c.initiator.id !== currentUserId
      );
    }
    // TRANSFER / CO_OWNER: only the invited counterparty responds
    return c.counterparty?.id === currentUserId;
  }

  function pendingHint(c: OwnershipChangeRow) {
    if (canRespondTo(c)) return null;
    if (c.initiator.id === currentUserId) {
      return "Waiting for a response — you can cancel this request.";
    }
    if (c.type === "REQUEST") {
      return "Waiting for a team owner (or org owner) to accept or decline.";
    }
    if (c.counterparty?.id === currentUserId) return null;
    return "Waiting for the invited member to accept or decline.";
  }

  const busy =
    adding || removing || creatingChange || responding || cancelling;

  const myPendingRequest = pending.find(
    (c) =>
      c.type === "REQUEST" &&
      c.initiator.id === currentUserId &&
      c.status === "PENDING",
  );

  const showOwnershipBlock =
    pending.length > 0 ||
    (canRequestOwnership && !myPendingRequest) ||
    Boolean(myPendingRequest);

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-medium text-ink">Members</h3>
          <span className="font-mono text-[11px] text-ink-faint">
            {members.length}
          </span>
        </div>

        {membersLoading ? (
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded-lg bg-line" />
            <div className="h-12 animate-pulse rounded-lg bg-line" />
          </div>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {members.map((m) => {
              const isSelf = m.user.id === currentUserId;
              const canOffer = isOwner && !isSelf && m.role !== "OWNER";
              const showRemove =
                (canManage && !isSelf) ||
                (isSelf && m.role !== "OWNER") ||
                (isSelf &&
                  m.role === "OWNER" &&
                  members.filter((x) => x.role === "OWNER").length > 1);

              return (
                <li
                  key={m.id}
                  className="flex flex-col gap-2 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {m.user.name}
                      {isSelf ? (
                        <span className="font-normal text-ink-faint"> you</span>
                      ) : null}
                    </p>
                    <p className="truncate text-ink-faint">{m.user.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className="rounded-md bg-canvas px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                      {m.role}
                    </span>
                    {canOffer ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onOffer("CO_OWNER", m.user.id)}
                          className="text-xs text-ink-muted underline-offset-2 transition-colors hover:text-ink hover:underline disabled:opacity-60"
                        >
                          Invite co-owner
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onOffer("TRANSFER", m.user.id)}
                          className="text-xs text-ink-muted underline-offset-2 transition-colors hover:text-ink hover:underline disabled:opacity-60"
                        >
                          Transfer
                        </button>
                      </>
                    ) : null}
                    {showRemove ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          setConfirmRemove({
                            userId: m.user.id,
                            name: m.user.name,
                            isSelf,
                          })
                        }
                        className="rounded-md px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-60"
                      >
                        {isSelf ? "Leave" : "Remove"}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
            {members.length === 0 ? (
              <li className="py-6 text-sm text-ink-faint">No members yet</li>
            ) : null}
          </ul>
        )}

        {canManage ? (
          <form
            onSubmit={onAdd}
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <label className="min-w-0 flex-1 text-sm">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">
                Add member
              </span>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand"
              >
                <option value="">Select from workspace…</option>
                {candidates.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name} ({m.user.email})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={busy || candidates.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {adding ? (
                <CircleNotch weight="bold" className="size-4 animate-spin" />
              ) : (
                "Add"
              )}
            </button>
          </form>
        ) : null}
      </div>

      {showOwnershipBlock ? (
        <div className="border-t border-line pt-6">
          <h3 className="text-sm font-medium text-ink">Ownership</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Offers and requests expire in 7 days.
          </p>

          {canRequestOwnership && !myPendingRequest ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onRequest()}
              className="mt-3 rounded-lg border border-line px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-60"
            >
              Request ownership
            </button>
          ) : null}

          {changesLoading ? (
            <div className="mt-4 h-16 animate-pulse rounded-lg bg-line" />
          ) : pending.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {pending.map((c) => {
                const hint = pendingHint(c);
                const showRespond = canRespondTo(c);
                return (
                  <li
                    key={c.id}
                    className="rounded-lg border border-line bg-surface px-4 py-3 text-sm"
                  >
                    <p className="font-medium text-ink">{changeLabel(c)}</p>
                    {hint ? (
                      <p className="mt-1 text-xs text-ink-faint">{hint}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {showRespond ? (
                        <>
                          <button
                            type="button"
                            disabled={busy || membersLoading}
                            onClick={() => onRespond(c.id, true)}
                            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] disabled:opacity-60"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={busy || membersLoading}
                            onClick={() => onRespond(c.id, false)}
                            className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-muted hover:bg-canvas disabled:opacity-60"
                          >
                            Decline
                          </button>
                        </>
                      ) : null}
                      {c.initiator.id === currentUserId ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onCancel(c.id)}
                          className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-muted hover:bg-canvas disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 text-sm text-danger"
        >
          <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {confirmRemove ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="presentation"
          onClick={() => {
            if (!removing) setConfirmRemove(null);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-member-title"
            aria-describedby="remove-member-desc"
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h4
              id="remove-member-title"
              className="font-display text-lg tracking-[-0.03em] text-ink"
            >
              {confirmRemove.isSelf ? "Leave team?" : "Remove member?"}
            </h4>
            <p id="remove-member-desc" className="mt-2 text-sm text-ink-muted">
              {confirmRemove.isSelf
                ? "Are you sure you want to leave this team? You will lose access until someone adds you again."
                : `Are you sure you want to remove ${confirmRemove.name} from this team?`}
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={removing}
                onClick={() => setConfirmRemove(null)}
                className="rounded-lg border border-line px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={() => void onConfirmRemove()}
                className="inline-flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {removing ? (
                  <CircleNotch weight="bold" className="size-4 animate-spin" />
                ) : null}
                {confirmRemove.isSelf ? "Leave team" : "Remove member"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
