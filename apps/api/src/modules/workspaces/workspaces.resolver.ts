import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser, type AuthUser } from "../auth/auth.types";
import { GqlAuthGuard } from "../../common/tenancy/gql-auth.guard";
import { OrgMemberGuard } from "../../common/tenancy/org-member.guard";
import { WorkspaceMemberGuard } from "../../common/tenancy/workspace-member.guard";
import { WorkspacesService } from "./workspaces.service";
import {
  ArchiveWorkspaceInput,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceMemberModel,
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
    @Args("includeArchived", { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.workspacesService.listForUser(
      user.id,
      organizationId,
      includeArchived ?? false,
    );
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

  @Query(() => [WorkspaceMemberModel])
  @UseGuards(GqlAuthGuard, WorkspaceMemberGuard)
  async workspaceMembers(
    @CurrentUser() user: AuthUser,
    @Args("workspaceId", { type: () => String }) workspaceId: string,
  ) {
    return this.workspacesService.listMembers(user.id, workspaceId);
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
    return this.workspacesService.getBySlugs(
      user.id,
      workspace.orgSlug,
      workspace.slug,
    );
  }

  @Mutation(() => WorkspaceModel)
  @UseGuards(GqlAuthGuard)
  async archiveWorkspace(
    @CurrentUser() user: AuthUser,
    @Args("input") input: ArchiveWorkspaceInput,
  ) {
    const workspace = await this.workspacesService.archive(
      user.id,
      input.workspaceId,
    );
    return this.workspacesService.getBySlugs(
      user.id,
      workspace.orgSlug,
      workspace.slug,
    );
  }

  @Mutation(() => WorkspaceModel)
  @UseGuards(GqlAuthGuard)
  async restoreWorkspace(
    @CurrentUser() user: AuthUser,
    @Args("input") input: ArchiveWorkspaceInput,
  ) {
    const workspace = await this.workspacesService.restore(
      user.id,
      input.workspaceId,
    );
    return this.workspacesService.getBySlugs(
      user.id,
      workspace.orgSlug,
      workspace.slug,
    );
  }
}
