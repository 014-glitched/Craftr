import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser, type AuthUser } from "../auth/auth.types";
import { GqlAuthGuard } from "../../common/tenancy/gql-auth.guard";
import { OrgMemberGuard } from "../../common/tenancy/org-member.guard";
import { WorkspaceMemberGuard } from "../../common/tenancy/workspace-member.guard";
import { WorkspacesService } from "./workspaces.service";
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceModel,
} from "./workspaces.types";

@Resolver()
export class WorkspacesResolver {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Query(() => [WorkspaceModel])
  @UseGuards(GqlAuthGuard, OrgMemberGuard)
  async myWorkspaces(
    @CurrentUser() user: AuthUser,
    @Args("organizationId", { type: () => String }) organizationId: string,
  ) {
    return this.workspacesService.listForUser(user.id, organizationId);
  }

  @Query(() => WorkspaceModel)
  @UseGuards(GqlAuthGuard, WorkspaceMemberGuard)
  async workspace(
    @CurrentUser() user: AuthUser,
    @Args("orgSlug") orgSlug: string,
    @Args("workspaceSlug") workspaceSlug: string,
  ) {
    return this.workspacesService.getBySlugs(user.id, orgSlug, workspaceSlug);
  }

  @Mutation(() => WorkspaceModel)
  @UseGuards(GqlAuthGuard, OrgMemberGuard)
  async createWorkspace(
    @CurrentUser() user: AuthUser,
    @Args("input") input: CreateWorkspaceInput,
  ) {
    const workspace = await this.workspacesService.create(
      user.id,
      input.organizationId,
      input.name,
      input.slug,
    );
    return this.workspacesService.getBySlugs(
      user.id,
      workspace.orgSlug,
      workspace.slug,
    );
  }

  @Mutation(() => WorkspaceModel)
  @UseGuards(GqlAuthGuard)
  async updateWorkspace(
    @CurrentUser() user: AuthUser,
    @Args("input") input: UpdateWorkspaceInput,
  ) {
    const workspace = await this.workspacesService.update(
      user.id,
      input.workspaceId,
      { name: input.name, slug: input.slug },
    );
    const full = await this.workspacesService.getBySlugs(
      user.id,
      workspace.orgSlug,
      workspace.slug,
    );
    return full;
  }
}
