import { registerEnumType } from "@nestjs/graphql";

export enum MemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  GUEST = "GUEST",
}

registerEnumType(MemberRole, {
  name: "MemberRole",
  description: "Organization, workspace, and team membership role",
});

const ROLE_RANK: Record<MemberRole, number> = {
  [MemberRole.OWNER]: 4,
  [MemberRole.ADMIN]: 3,
  [MemberRole.MEMBER]: 2,
  [MemberRole.GUEST]: 1,
};

export function hasMinRole(
  role: MemberRole,
  minimum: MemberRole,
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function toPrismaRole(role: MemberRole): "OWNER" | "ADMIN" | "MEMBER" | "GUEST" {
  return role as "OWNER" | "ADMIN" | "MEMBER" | "GUEST";
}

export function fromPrismaRole(
  role: "OWNER" | "ADMIN" | "MEMBER" | "GUEST",
): MemberRole {
  return MemberRole[role];
}
