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
