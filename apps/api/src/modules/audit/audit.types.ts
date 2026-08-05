import { Field, ID, ObjectType, registerEnumType } from "@nestjs/graphql";

export enum AuditAction {
  TEAM_CREATED = "TEAM_CREATED",
  TEAM_UPDATED = "TEAM_UPDATED",
  TEAM_MEMBER_ADDED = "TEAM_MEMBER_ADDED",
  TEAM_MEMBER_REMOVED = "TEAM_MEMBER_REMOVED",
  OWNERSHIP_OFFERED = "OWNERSHIP_OFFERED",
  OWNERSHIP_REQUESTED = "OWNERSHIP_REQUESTED",
  OWNERSHIP_ACCEPTED = "OWNERSHIP_ACCEPTED",
  OWNERSHIP_DECLINED = "OWNERSHIP_DECLINED",
  OWNERSHIP_CANCELLED = "OWNERSHIP_CANCELLED",
  WORKSPACE_CREATED = "WORKSPACE_CREATED",
  WORKSPACE_UPDATED = "WORKSPACE_UPDATED",
  WORKSPACE_ARCHIVED = "WORKSPACE_ARCHIVED",
  WORKSPACE_RESTORED = "WORKSPACE_RESTORED",
  INVITATION_CREATED = "INVITATION_CREATED",
  ORG_MEMBER_REMOVED = "ORG_MEMBER_REMOVED",
}

registerEnumType(AuditAction, {
  name: "AuditAction",
  description: "Append-only audit event kinds for tenancy and teams",
});

@ObjectType()
export class AuditActorModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;
}

@ObjectType()
export class AuditLogModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  organizationId!: string;

  @Field(() => ID, { nullable: true })
  workspaceId?: string | null;

  @Field(() => AuditAction)
  action!: AuditAction;

  @Field()
  entityType!: string;

  @Field(() => ID, { nullable: true })
  entityId?: string | null;

  @Field()
  summary!: string;

  /** JSON string of optional structured metadata */
  @Field(() => String, { nullable: true })
  metadata?: string | null;

  @Field()
  createdAt!: Date;

  @Field(() => AuditActorModel)
  actor!: AuditActorModel;
}

export type RecordAuditInput = {
  organizationId: string;
  workspaceId?: string | null;
  actorUserId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
};
