import { Args, Field, ID, InputType, ObjectType } from "@nestjs/graphql";
import { MemberRole } from "../../common/tenancy/member-role.enum";

@ObjectType()
export class OrganizationModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field(() => MemberRole, { nullable: true })
  myRole?: MemberRole;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class OrganizationMemberUserModel {
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
export class OrganizationMemberModel {
  @Field(() => ID)
  id!: string;

  @Field(() => MemberRole)
  role!: MemberRole;

  @Field()
  joinedAt!: Date;

  @Field(() => OrganizationMemberUserModel)
  user!: OrganizationMemberUserModel;
}

@ObjectType()
export class WorkspaceRefModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field()
  orgSlug!: string;
}

@ObjectType()
export class CreateOrganizationPayload {
  @Field(() => OrganizationModel)
  organization!: OrganizationModel;
}

@ObjectType()
export class InvitationModel {
  @Field(() => ID)
  id!: string;

  @Field()
  token!: string;

  @Field()
  email!: string;

  @Field(() => MemberRole)
  role!: MemberRole;

  @Field()
  expiresAt!: Date;
}

@ObjectType()
export class InvitationPreviewModel {
  @Field()
  organizationName!: string;

  @Field()
  organizationSlug!: string;

  @Field(() => String, { nullable: true })
  workspaceName?: string | null;

  @Field()
  emailMasked!: string;

  /** Exact invite email — used so login/signup can enforce the intended recipient. */
  @Field()
  email!: string;

  @Field(() => MemberRole)
  role!: MemberRole;

  @Field()
  expiresAt!: Date;
}

@ObjectType()
export class AcceptInvitationPayload {
  @Field(() => OrganizationModel)
  organization!: OrganizationModel;

  @Field(() => WorkspaceRefModel, { nullable: true })
  workspace?: WorkspaceRefModel | null;
}

@InputType()
export class CreateOrganizationInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  slug?: string;
}

@InputType()
export class UpdateOrganizationInput {
  @Field(() => ID)
  organizationId!: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  slug?: string;
}

@InputType()
export class CreateInvitationInput {
  @Field(() => ID)
  organizationId!: string;

  @Field()
  email!: string;

  @Field(() => MemberRole, { defaultValue: MemberRole.MEMBER })
  role!: MemberRole;

  @Field(() => ID, { nullable: true })
  workspaceId?: string;
}

@InputType()
export class RemoveOrganizationMemberInput {
  @Field(() => ID)
  organizationId!: string;

  @Field(() => ID)
  userId!: string;
}
