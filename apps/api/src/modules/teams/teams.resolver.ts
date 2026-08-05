import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser, type AuthUser } from "../auth/auth.types";
import { GqlAuthGuard } from "../../common/tenancy/gql-auth.guard";
import { WorkspaceMemberGuard } from "../../common/tenancy/workspace-member.guard";
import { TeamMemberGuard } from "../../common/tenancy/team-member.guard";
import { TeamsService } from "./teams.service";
import {
  AddTeamMemberInput,
  CancelTeamOwnershipChangeInput,
  CreateTeamInput,
  CreateTeamOwnershipChangeInput,
  RemoveTeamMemberInput,
  RespondTeamOwnershipChangeInput,
  TeamMemberModel,
  TeamModel,
  TeamOwnershipChangeModel,
  UpdateTeamInput,
} from "./teams.types";

@Resolver()
export class TeamsResolver {
  constructor(private readonly teamsService: TeamsService) {}

  @Query(() => [TeamModel])
  @UseGuards(GqlAuthGuard, WorkspaceMemberGuard)
  async myTeams(
    @CurrentUser() user: AuthUser,
    @Args("workspaceId", { type: () => String }) workspaceId: string,
  ) {
    return this.teamsService.listMyTeams(user.id, workspaceId);
  }

  @Query(() => [TeamModel])
  @UseGuards(GqlAuthGuard, WorkspaceMemberGuard)
  async workspaceTeams(
    @CurrentUser() user: AuthUser,
    @Args("workspaceId", { type: () => String }) workspaceId: string,
  ) {
    return this.teamsService.listWorkspaceTeams(user.id, workspaceId);
  }

  @Query(() => TeamModel)
  @UseGuards(GqlAuthGuard, TeamMemberGuard)
  async team(
    @CurrentUser() user: AuthUser,
    @Args("orgSlug") orgSlug: string,
    @Args("workspaceSlug") workspaceSlug: string,
    @Args("teamSlug") teamSlug: string,
  ) {
    return this.teamsService.getBySlugs(
      user.id,
      orgSlug,
      workspaceSlug,
      teamSlug,
    );
  }

  @Query(() => [TeamMemberModel])
  @UseGuards(GqlAuthGuard)
  async teamMembers(
    @CurrentUser() user: AuthUser,
    @Args("teamId", { type: () => String }) teamId: string,
  ) {
    return this.teamsService.listMembers(user.id, teamId);
  }

  @Query(() => [TeamOwnershipChangeModel])
  @UseGuards(GqlAuthGuard)
  async teamOwnershipChanges(
    @CurrentUser() user: AuthUser,
    @Args("teamId", { type: () => String }) teamId: string,
  ) {
    return this.teamsService.listOwnershipChanges(user.id, teamId);
  }

  @Query(() => [TeamOwnershipChangeModel])
  @UseGuards(GqlAuthGuard)
  async myTeamOwnershipInbox(@CurrentUser() user: AuthUser) {
    return this.teamsService.listMyOwnershipInbox(user.id);
  }

  @Mutation(() => TeamModel)
  @UseGuards(GqlAuthGuard)
  async createTeam(
    @CurrentUser() user: AuthUser,
    @Args("input") input: CreateTeamInput,
  ) {
    return this.teamsService.create(
      user.id,
      input.workspaceId,
      input.name,
      input.slug,
    );
  }

  @Mutation(() => TeamModel)
  @UseGuards(GqlAuthGuard)
  async updateTeam(
    @CurrentUser() user: AuthUser,
    @Args("input") input: UpdateTeamInput,
  ) {
    return this.teamsService.update(user.id, input.teamId, {
      name: input.name,
      slug: input.slug,
    });
  }

  @Mutation(() => TeamMemberModel)
  @UseGuards(GqlAuthGuard)
  async addTeamMember(
    @CurrentUser() user: AuthUser,
    @Args("input") input: AddTeamMemberInput,
  ) {
    return this.teamsService.addMember(
      user.id,
      input.teamId,
      input.userId,
      input.role,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async removeTeamMember(
    @CurrentUser() user: AuthUser,
    @Args("input") input: RemoveTeamMemberInput,
  ) {
    return this.teamsService.removeMember(
      user.id,
      input.teamId,
      input.userId,
    );
  }

  @Mutation(() => TeamOwnershipChangeModel)
  @UseGuards(GqlAuthGuard)
  async createTeamOwnershipChange(
    @CurrentUser() user: AuthUser,
    @Args("input") input: CreateTeamOwnershipChangeInput,
  ) {
    return this.teamsService.createOwnershipChange(user.id, {
      teamId: input.teamId,
      type: input.type,
      counterpartyUserId: input.counterpartyUserId,
      message: input.message,
    });
  }

  @Mutation(() => TeamOwnershipChangeModel)
  @UseGuards(GqlAuthGuard)
  async respondTeamOwnershipChange(
    @CurrentUser() user: AuthUser,
    @Args("input") input: RespondTeamOwnershipChangeInput,
  ) {
    return this.teamsService.respondOwnershipChange(user.id, {
      changeId: input.changeId,
      accept: input.accept,
    });
  }

  @Mutation(() => TeamOwnershipChangeModel)
  @UseGuards(GqlAuthGuard)
  async cancelTeamOwnershipChange(
    @CurrentUser() user: AuthUser,
    @Args("input") input: CancelTeamOwnershipChangeInput,
  ) {
    return this.teamsService.cancelOwnershipChange(user.id, input.changeId);
  }
}
