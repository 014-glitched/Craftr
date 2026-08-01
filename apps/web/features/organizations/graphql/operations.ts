import { gql } from "@apollo/client";

export const MY_ORGANIZATIONS = gql`
  query MyOrganizations {
    myOrganizations {
      id
      name
      slug
      myRole
    }
  }
`;

export const MY_WORKSPACES = gql`
  query MyWorkspaces($organizationId: String!) {
    myWorkspaces(organizationId: $organizationId) {
      id
      name
      slug
      orgSlug
      organizationId
      myRole
    }
  }
`;

export const WORKSPACE = gql`
  query Workspace($orgSlug: String!, $workspaceSlug: String!) {
    workspace(orgSlug: $orgSlug, workspaceSlug: $workspaceSlug) {
      id
      name
      slug
      orgSlug
      organizationId
      myRole
    }
  }
`;

export const ORGANIZATION_MEMBERS = gql`
  query OrganizationMembers($organizationId: String!) {
    organizationMembers(organizationId: $organizationId) {
      id
      role
      joinedAt
      user {
        id
        name
        email
        image
      }
    }
  }
`;

export const INVITATION_PREVIEW = gql`
  query InvitationPreview($token: String!) {
    invitationPreview(token: $token) {
      organizationName
      organizationSlug
      workspaceName
      emailMasked
      email
      role
      expiresAt
    }
  }
`;

export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      organization {
        id
        name
        slug
        myRole
      }
      defaultWorkspace {
        id
        name
        slug
        orgSlug
      }
    }
  }
`;

export const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
      id
      name
      slug
      orgSlug
      organizationId
      myRole
    }
  }
`;

export const CREATE_INVITATION = gql`
  mutation CreateInvitation($input: CreateInvitationInput!) {
    createInvitation(input: $input) {
      id
      token
      email
      role
      expiresAt
    }
  }
`;

export const ACCEPT_INVITATION = gql`
  mutation AcceptInvitation($token: String!) {
    acceptInvitation(token: $token) {
      organization {
        id
        name
        slug
        myRole
      }
      workspace {
        id
        name
        slug
        orgSlug
      }
    }
  }
`;

export const REMOVE_ORGANIZATION_MEMBER = gql`
  mutation RemoveOrganizationMember($input: RemoveOrganizationMemberInput!) {
    removeOrganizationMember(input: $input)
  }
`;

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  myRole?: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  orgSlug: string;
  organizationId: string;
  myRole?: string;
};

export type MyOrganizationsQuery = {
  myOrganizations: OrganizationSummary[];
};

export type MyWorkspacesQuery = {
  myWorkspaces: WorkspaceSummary[];
};

export type WorkspaceQuery = {
  workspace: WorkspaceSummary;
};

export type OrganizationMembersQuery = {
  organizationMembers: Array<{
    id: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  }>;
};

export type InvitationPreviewQuery = {
  invitationPreview: {
    organizationName: string;
    organizationSlug: string;
    workspaceName?: string | null;
    emailMasked: string;
    email: string;
    role: string;
    expiresAt: string;
  };
};

export type CreateOrganizationMutation = {
  createOrganization: {
    organization: OrganizationSummary;
    defaultWorkspace: {
      id: string;
      name: string;
      slug: string;
      orgSlug: string;
    };
  };
};

export type CreateWorkspaceMutation = {
  createWorkspace: WorkspaceSummary;
};

export type CreateInvitationMutation = {
  createInvitation: {
    id: string;
    token: string;
    email: string;
    role: string;
    expiresAt: string;
  };
};

export type AcceptInvitationMutation = {
  acceptInvitation: {
    organization: OrganizationSummary;
    workspace?: {
      id: string;
      name: string;
      slug: string;
      orgSlug: string;
    } | null;
  };
};
