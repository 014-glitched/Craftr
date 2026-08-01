"use client";

import { useQuery } from "@apollo/client/react";
import {
  INVITATION_PREVIEW,
  type InvitationPreviewQuery,
} from "@/features/organizations/graphql/operations";
import { inviteTokenFromPath } from "@/lib/safe-next";

export function useInviteGate(nextPath: string) {
  const token = inviteTokenFromPath(nextPath);

  const { data, loading, error } = useQuery<InvitationPreviewQuery>(
    INVITATION_PREVIEW,
    {
      variables: { token: token ?? "" },
      skip: !token,
      fetchPolicy: "network-only",
    },
  );

  const invite = data?.invitationPreview ?? null;

  return {
    token,
    inviteEmail: invite?.email ?? null,
    organizationName: invite?.organizationName ?? null,
    loading: Boolean(token) && loading,
    invalid: Boolean(token) && !loading && (Boolean(error) || !invite),
  };
}
