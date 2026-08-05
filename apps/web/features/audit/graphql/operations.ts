import { gql } from "@apollo/client";

export const WORKSPACE_AUDIT_LOGS = gql`
  query WorkspaceAuditLogs($workspaceId: String!, $limit: Int) {
    workspaceAuditLogs(workspaceId: $workspaceId, limit: $limit) {
      id
      organizationId
      workspaceId
      action
      entityType
      entityId
      summary
      metadata
      createdAt
      actor {
        id
        name
        email
      }
    }
  }
`;

export const ORGANIZATION_AUDIT_LOGS = gql`
  query OrganizationAuditLogs($organizationId: String!, $limit: Int) {
    organizationAuditLogs(organizationId: $organizationId, limit: $limit) {
      id
      organizationId
      workspaceId
      action
      entityType
      entityId
      summary
      metadata
      createdAt
      actor {
        id
        name
        email
      }
    }
  }
`;

export type AuditLogRow = {
  id: string;
  organizationId: string;
  workspaceId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
};

export type WorkspaceAuditLogsQuery = {
  workspaceAuditLogs: AuditLogRow[];
};

export type OrganizationAuditLogsQuery = {
  organizationAuditLogs: AuditLogRow[];
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  TEAM_CREATED: "Team created",
  TEAM_UPDATED: "Team updated",
  TEAM_MEMBER_ADDED: "Team member added",
  TEAM_MEMBER_REMOVED: "Team member removed",
  OWNERSHIP_OFFERED: "Ownership offered",
  OWNERSHIP_REQUESTED: "Ownership requested",
  OWNERSHIP_ACCEPTED: "Ownership accepted",
  OWNERSHIP_DECLINED: "Ownership declined",
  OWNERSHIP_CANCELLED: "Ownership cancelled",
  WORKSPACE_CREATED: "Workspace created",
  WORKSPACE_UPDATED: "Workspace updated",
  WORKSPACE_ARCHIVED: "Workspace archived",
  WORKSPACE_RESTORED: "Workspace restored",
  INVITATION_CREATED: "Invitation created",
  ORG_MEMBER_REMOVED: "Org member removed",
};
