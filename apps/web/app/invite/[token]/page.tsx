"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { signOut, useSession } from "@/lib/auth-client";
import {
  ACCEPT_INVITATION,
  INVITATION_PREVIEW,
  MY_ORGANIZATIONS,
  type AcceptInvitationMutation,
  type InvitationPreviewQuery,
} from "@/features/organizations/graphql/operations";
import { useTenancyStore } from "@/features/tenancy/store/workspace-context";
import { apolloErrorMessage } from "@/lib/apollo-errors";
import { emailsMatch } from "@/lib/safe-next";

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { data: session, isPending: sessionPending } = useSession();
  const setActiveWorkspace = useTenancyStore((s) => s.setActiveWorkspace);
  const clearTenancy = useTenancyStore((s) => s.clear);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, loading, error } = useQuery<InvitationPreviewQuery>(
    INVITATION_PREVIEW,
    {
      variables: { token },
      skip: !token,
    },
  );

  const [acceptInvitation, { loading: accepting }] =
    useMutation<AcceptInvitationMutation>(ACCEPT_INVITATION);

  const preview = data?.invitationPreview;
  const sessionEmail = session?.user?.email;
  const emailMatches =
    Boolean(sessionEmail && preview?.email) &&
    emailsMatch(sessionEmail!, preview!.email);

  async function handleAccept() {
    setAcceptError(null);

    if (!session?.user) {
      router.push(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
      return;
    }

    if (!emailMatches) {
      setAcceptError(
        `This invitation was sent to ${preview?.email}. Switch to that account to accept.`,
      );
      return;
    }

    try {
      const result = await acceptInvitation({
        variables: { token },
        refetchQueries: [{ query: MY_ORGANIZATIONS }],
        awaitRefetchQueries: true,
      });

      if (result.error) {
        setAcceptError(
          apolloErrorMessage(
            result.error,
            "Unable to accept this invitation.",
          ),
        );
        return;
      }

      const payload = result.data?.acceptInvitation;
      if (!payload) {
        setAcceptError("Unable to accept this invitation.");
        return;
      }

      const ws = payload.workspace;
      const orgSlug = payload.organization.slug;
      const wsSlug = ws?.slug ?? "general";

      if (ws) {
        setActiveWorkspace({
          id: ws.id,
          slug: ws.slug,
          orgSlug: ws.orgSlug,
          organizationId: payload.organization.id,
        });
      } else {
        setActiveWorkspace({
          id: "",
          slug: wsSlug,
          orgSlug,
          organizationId: payload.organization.id,
        });
      }

      setSuccessMessage(
        `Joined ${payload.organization.name}. Opening workspace…`,
      );
      router.replace(`/app/${orgSlug}/${wsSlug}`);
    } catch (err) {
      setAcceptError(
        apolloErrorMessage(err, "Unable to accept this invitation."),
      );
    }
  }

  async function handleSwitchAccount() {
    clearTenancy();
    await signOut();
    router.push(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
    router.refresh();
  }

  if (loading || sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <CircleNotch weight="bold" className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
        <div className="max-w-md text-center">
          <WarningCircle
            weight="fill"
            className="mx-auto size-10 text-danger"
          />
          <h1 className="mt-4 font-display text-2xl">Invalid invitation</h1>
          <p className="mt-2 text-sm text-ink-muted">
            This link may be expired or already used.
          </p>
          <Link href="/login" className="mt-6 inline-block text-brand">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const invitePath = `/invite/${token}`;
  const loginHref = `/login?next=${encodeURIComponent(invitePath)}`;
  const signupHref = `/signup?next=${encodeURIComponent(invitePath)}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-md animate-auth-rise rounded-2xl border border-line bg-surface p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Invitation
        </p>
        <h1 className="mt-2 font-display text-2xl tracking-[-0.04em]">
          Join {preview.organizationName}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Invited as <strong>{preview.role.toLowerCase()}</strong>
          {preview.workspaceName
            ? ` · workspace ${preview.workspaceName}`
            : null}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Sent to <strong>{preview.email}</strong>
        </p>

        {!session?.user ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-ink-muted">
              Sign in or create an account with <strong>{preview.email}</strong>{" "}
              to accept.
            </p>
            <Link
              href={loginHref}
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-accent py-3 text-sm font-semibold text-accent-fg"
            >
              Sign in to accept
            </Link>
            <Link
              href={signupHref}
              className="inline-flex w-full items-center justify-center rounded-[10px] border border-line-strong py-3 text-sm font-medium text-ink"
            >
              Create an account
            </Link>
          </div>
        ) : emailMatches ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-ink-muted">
              Signed in as <strong>{session.user.email}</strong>
            </p>
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting || Boolean(successMessage)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-accent py-3 text-sm font-semibold text-accent-fg disabled:opacity-60"
            >
              {accepting ? (
                <CircleNotch weight="bold" className="size-4 animate-spin" />
              ) : null}
              {successMessage ? "Redirecting…" : "Accept invitation"}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <div
              role="alert"
              className="flex items-start gap-2 rounded-[10px] border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
            >
              <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" />
              <span>
                You&apos;re signed in as <strong>{session.user.email}</strong>,
                but this invite is for <strong>{preview.email}</strong>. Switch
                accounts to continue.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-accent py-3 text-sm font-semibold text-accent-fg"
            >
              Switch to invited account
            </button>
          </div>
        )}

        {acceptError ? (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-[10px] border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
          >
            <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" />
            <span>{acceptError}</span>
          </div>
        ) : null}

        {successMessage ? (
          <p className="mt-4 text-sm text-ink-muted" role="status">
            {successMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
