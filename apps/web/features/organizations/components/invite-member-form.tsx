"use client";

import { useMutation } from "@apollo/client/react";
import { FormEvent, useState } from "react";
import { Check, CircleNotch, Copy } from "@phosphor-icons/react";
import { AuthField } from "@/features/auth/components/auth-field";
import {
  CREATE_INVITATION,
  type CreateInvitationMutation,
} from "@/features/organizations/graphql/operations";
import { inviteEmailSchema } from "@/lib/tenancy-validation";

export function InviteMemberForm({
  organizationId,
  workspaceId,
}: {
  organizationId: string;
  workspaceId?: string;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [createInvitation, { loading }] =
    useMutation<CreateInvitationMutation>(CREATE_INVITATION);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = inviteEmailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }
    setError(undefined);

    try {
      const result = await createInvitation({
        variables: {
          input: {
            organizationId,
            email: parsed.data,
            role: "MEMBER",
            workspaceId,
          },
        },
      });

      if (result.error) {
        setError(
          result.error.message || "Unable to create invitation.",
        );
        return;
      }

      const token = result.data?.createInvitation?.token;
      if (!token) {
        setError("Unable to create invitation.");
        return;
      }

      // Prefer browser origin so copied links always hit this app instance
      const base =
        typeof window !== "undefined"
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
      setInviteUrl(`${base}/invite/${token}`);
      setEmail("");
      setCopied(false);
    } catch {
      setError("Unable to create invitation.");
    }
  }

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
        <div className="min-w-0 flex-1">
          <AuthField
            id="invite-email"
            label="Invite by email"
            type="email"
            placeholder="teammate@company.com"
            value={email}
            error={error}
            onChange={(ev) => {
              setEmail(ev.target.value);
              if (error) setError(undefined);
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-semibold text-accent-fg disabled:opacity-60"
        >
          {loading ? (
            <CircleNotch weight="bold" className="size-4 animate-spin" />
          ) : (
            "Create link"
          )}
        </button>
      </form>

      {inviteUrl ? (
        <div className="rounded-xl border border-line bg-canvas p-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
            Share this link
          </p>
          <p className="mt-2 break-all text-sm text-ink-muted">{inviteUrl}</p>
          <button
            type="button"
            onClick={copyLink}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand"
          >
            {copied ? (
              <>
                <Check weight="bold" className="size-4" />
                Copied
              </>
            ) : (
              <>
                <Copy weight="bold" className="size-4" />
                Copy link
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
