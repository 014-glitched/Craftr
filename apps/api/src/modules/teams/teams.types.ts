import { Field, ID, InputType, ObjectType, registerEnumType } from "@nestjs/graphql";
import { MemberRole } from "../../common/tenancy/member-role.enum";

@ObjectType()
export class TeamModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field(() => ID)
  workspaceId!: string;

  @Field()
  workspaceSlug!: string;

  @Field()
  orgSlug!: string;

  @Field(() => MemberRole, { nullable: true })
  myRole?: MemberRole | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class TeamMemberUserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  image?: string | null;
}

@ObjectType()
export class TeamMemberModel {
  @Field(() => ID)
  id!: string;

  @Field(() => MemberRole)
  role!: MemberRole;

  @Field()
  joinedAt!: Date;

  @Field(() => TeamMemberUserModel)
  user!: TeamMemberUserModel;
}

@InputType()
export class CreateTeamInput {
  @Field(() => ID)
  workspaceId!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  slug?: string;
}

@InputType()
export class UpdateTeamInput {
  @Field(() => ID)
  teamId!: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  slug?: string;
}

@InputType()
export class AddTeamMemberInput {
  @Field(() => ID)
  teamId!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => MemberRole, { defaultValue: MemberRole.MEMBER })
  role!: MemberRole;
}

@InputType()
export class RemoveTeamMemberInput {
  @Field(() => ID)
  teamId!: string;

  @Field(() => ID)
  userId!: string;
}

export enum TeamOwnershipChangeType {
  TRANSFER = "TRANSFER",
  CO_OWNER = "CO_OWNER",
  REQUEST = "REQUEST",
}

registerEnumType(TeamOwnershipChangeType, {
  name: "TeamOwnershipChangeType",
  description:
    "TRANSFER demotes the offering owner to ADMIN; CO_OWNER keeps both; REQUEST asks owners to promote the requester",
});

export enum TeamOwnershipChangeStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  CANCELLED = "CANCELLED",
}

registerEnumType(TeamOwnershipChangeStatus, {
  name: "TeamOwnershipChangeStatus",
});

@ObjectType()
export class TeamOwnershipChangeModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  teamId!: string;

  @Field()
  teamName!: string;

  @Field(() => TeamOwnershipChangeType)
  type!: TeamOwnershipChangeType;

  @Field(() => TeamOwnershipChangeStatus)
  status!: TeamOwnershipChangeStatus;

  @Field(() => TeamMemberUserModel)
  initiator!: TeamMemberUserModel;

  @Field(() => TeamMemberUserModel, { nullable: true })
  counterparty?: TeamMemberUserModel | null;

  @Field(() => TeamMemberUserModel, { nullable: true })
  responder?: TeamMemberUserModel | null;

  @Field(() => String, { nullable: true })
  message?: string | null;

  @Field()
  expiresAt!: Date;

  @Field(() => Date, { nullable: true })
  resolvedAt?: Date | null;

  @Field()
  createdAt!: Date;
}

@InputType()
export class CreateTeamOwnershipChangeInput {
  @Field(() => ID)
  teamId!: string;

  @Field(() => TeamOwnershipChangeType)
  type!: TeamOwnershipChangeType;

  @Field(() => ID, { nullable: true })
  counterpartyUserId?: string;

  @Field({ nullable: true })
  message?: string;
}

@InputType()
export class RespondTeamOwnershipChangeInput {
  @Field(() => ID)
  changeId!: string;

  @Field()
  accept!: boolean;
}

@InputType()
export class CancelTeamOwnershipChangeInput {
  @Field(() => ID)
  changeId!: string;
}
