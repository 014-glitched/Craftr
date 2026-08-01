import type { AuthUser } from "../../modules/auth/auth.types";
import { MemberRole } from "./member-role.enum";

export type OrgMembershipContext = {
  organizationId: string;
  role: MemberRole;
};

export type WorkspaceMembershipContext = {
  workspaceId: string;
  organizationId: string;
  role: MemberRole;
};

export type GqlContext = {
  req: Request;
  res: Response;
  user?: AuthUser;
  orgMembership?: OrgMembershipContext;
  workspaceMembership?: WorkspaceMembershipContext;
};
