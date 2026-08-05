import { Args, Field, ID, InputType, ObjectType } from "@nestjs/graphql";
import { MemberRole } from "../../common/tenancy/member-role.enum";

@ObjectType()
export class WorkspaceModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field()
  orgSlug!: string;

  @Field(() => ID)
  organizationId!: string;

  @Field(() => MemberRole, { nullable: true })
  myRole?: MemberRole;

  @Field(() => Date, { nullable: true })
  archivedAt?: Date | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@InputType()
export class CreateWorkspaceInput {
  @Field(() => ID)
  organizationId!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  slug?: string;
}

@InputType()
export class UpdateWorkspaceInput {
  @Field(() => ID)
  workspaceId!: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  slug?: string;
}

@InputType()
export class ArchiveWorkspaceInput {
  @Field(() => ID)
  workspaceId!: string;
}

@ObjectType()
export class WorkspaceMemberUserModel {
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
export class WorkspaceMemberModel {
  @Field(() => ID)
  id!: string;

  @Field(() => MemberRole)
  role!: MemberRole;

  @Field()
  joinedAt!: Date;

  @Field(() => WorkspaceMemberUserModel)
  user!: WorkspaceMemberUserModel;
}
