import { gql } from "@apollo/client";

export const WORKSPACE_TEAMS = gql`
  query WorkspaceTeams($workspaceId: String!) {
    workspaceTeams(workspaceId: $workspaceId) {
      id
      name
      slug
      workspaceId
      workspaceSlug
      orgSlug
      myRole
    }
  }
`;

export const MY_TEAMS = gql`
  query MyTeams($workspaceId: String!) {
    myTeams(workspaceId: $workspaceId) {
      id
      name
      slug
      workspaceId
      workspaceSlug
      orgSlug
      myRole
    }
  }
`;

export const TEAM = gql`
  query Team(
    $orgSlug: String!
    $workspaceSlug: String!
    $teamSlug: String!
  ) {
    team(
      orgSlug: $orgSlug
      workspaceSlug: $workspaceSlug
      teamSlug: $teamSlug
    ) {
      id
      name
      slug
      workspaceId
      workspaceSlug
      orgSlug
      myRole
    }
  }
`;

export const TEAM_MEMBERS = gql`
  query TeamMembers($teamId: String!) {
    teamMembers(teamId: $teamId) {
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

export const WORKSPACE_MEMBERS = gql`
  query WorkspaceMembers($workspaceId: String!) {
    workspaceMembers(workspaceId: $workspaceId) {
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

export const CREATE_TEAM = gql`
  mutation CreateTeam($input: CreateTeamInput!) {
    createTeam(input: $input) {
      id
      name
      slug
      workspaceId
      workspaceSlug
      orgSlug
      myRole
    }
  }
`;

export const ADD_TEAM_MEMBER = gql`
  mutation AddTeamMember($input: AddTeamMemberInput!) {
    addTeamMember(input: $input) {
      id
      role
      joinedAt
      user {
        id
        name
        email
      }
    }
  }
`;

export const REMOVE_TEAM_MEMBER = gql`
  mutation RemoveTeamMember($input: RemoveTeamMemberInput!) {
    removeTeamMember(input: $input)
  }
`;

export const TEAM_OWNERSHIP_CHANGES = gql`
  query TeamOwnershipChanges($teamId: String!) {
    teamOwnershipChanges(teamId: $teamId) {
      id
      teamId
      teamName
      type
      status
      message
      expiresAt
      createdAt
      initiator {
        id
        name
        email
      }
      counterparty {
        id
        name
        email
      }
      responder {
        id
        name
        email
      }
    }
  }
`;

export const CREATE_TEAM_OWNERSHIP_CHANGE = gql`
  mutation CreateTeamOwnershipChange($input: CreateTeamOwnershipChangeInput!) {
    createTeamOwnershipChange(input: $input) {
      id
      type
      status
      teamId
    }
  }
`;

export const RESPOND_TEAM_OWNERSHIP_CHANGE = gql`
  mutation RespondTeamOwnershipChange(
    $input: RespondTeamOwnershipChangeInput!
  ) {
    respondTeamOwnershipChange(input: $input) {
      id
      type
      status
    }
  }
`;

export const CANCEL_TEAM_OWNERSHIP_CHANGE = gql`
  mutation CancelTeamOwnershipChange($input: CancelTeamOwnershipChangeInput!) {
    cancelTeamOwnershipChange(input: $input) {
      id
      status
    }
  }
`;

export type TeamSummary = {
  id: string;
  name: string;
  slug: string;
  workspaceId: string;
  workspaceSlug: string;
  orgSlug: string;
  myRole?: string | null;
};

export type TeamMemberRow = {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

export type OwnershipChangeRow = {
  id: string;
  teamId: string;
  teamName: string;
  type: "TRANSFER" | "CO_OWNER" | "REQUEST";
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
  message?: string | null;
  expiresAt: string;
  createdAt: string;
  initiator: { id: string; name: string; email: string };
  counterparty?: { id: string; name: string; email: string } | null;
  responder?: { id: string; name: string; email: string } | null;
};

export type WorkspaceTeamsQuery = {
  workspaceTeams: TeamSummary[];
};

export type MyTeamsQuery = {
  myTeams: TeamSummary[];
};

export type TeamQuery = {
  team: TeamSummary;
};

export type TeamMembersQuery = {
  teamMembers: TeamMemberRow[];
};

export type WorkspaceMembersQuery = {
  workspaceMembers: TeamMemberRow[];
};

export type TeamOwnershipChangesQuery = {
  teamOwnershipChanges: OwnershipChangeRow[];
};

export type CreateTeamMutation = {
  createTeam: TeamSummary;
};

export type AddTeamMemberMutation = {
  addTeamMember: TeamMemberRow;
};

export type RemoveTeamMemberMutation = {
  removeTeamMember: boolean;
};

export type CreateTeamOwnershipChangeMutation = {
  createTeamOwnershipChange: {
    id: string;
    type: string;
    status: string;
    teamId: string;
  };
};

export type RespondTeamOwnershipChangeMutation = {
  respondTeamOwnershipChange: {
    id: string;
    type: string;
    status: string;
  };
};

export type CancelTeamOwnershipChangeMutation = {
  cancelTeamOwnershipChange: {
    id: string;
    status: string;
  };
};
