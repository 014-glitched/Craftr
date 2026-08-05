import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser, type AuthUser } from "../auth/auth.types";
import { GqlAuthGuard } from "../../common/tenancy/gql-auth.guard";
import { OrgMemberGuard } from "../../common/tenancy/org-member.guard";
import { MemberRole, fromPrismaRole } from "../../common/tenancy/member-role.enum";
import { InvitationsService } from "./invitations.service";
import { OrganizationsService } from "./organizations.service";
import {
  AcceptInvitationPayload,
  CreateInvitationInput,
  CreateOrganizationInput,
  CreateOrganizationPayload,
  InvitationModel,
  InvitationPreviewModel,
  OrganizationMemberModel,
  OrganizationModel,
  RemoveOrganizationMemberInput,
  UpdateOrganizationInput,
} from "./organizations.types";

@Resolver()
export class OrganizationsResolver {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly invitationsService: InvitationsService,
  ) {}

  @Query(() => [OrganizationModel])
  @UseGuards(GqlAuthGuard)
  async myOrganizations(@CurrentUser() user: AuthUser) {
    return this.organizationsService.listForUser(user.id);
  }

  @Query(() => OrganizationModel)
  @UseGuards(GqlAuthGuard, OrgMemberGuard)
  async organization(
    @CurrentUser() user: AuthUser,
    @Args("slug") slug: string,
  ) {
    return this.organizationsService.getBySlug(user.id, slug);
  }

  @Query(() => [OrganizationMemberModel])
  @UseGuards(GqlAuthGuard, OrgMemberGuard)
  async organizationMembers(
    @CurrentUser() user: AuthUser,
    @Args("organizationId", { type: () => String }) organizationId: string,
  ) {
    return this.organizationsService.listMembers(user.id, organizationId);
  }

  @Query(() => InvitationPreviewModel)
  async invitationPreview(@Args("token") token: string) {
    return this.invitationsService.preview(token);
  }

  @Mutation(() => CreateOrganizationPayload)
  @UseGuards(GqlAuthGuard)
  async createOrganization(
    @CurrentUser() user: AuthUser,
    @Args("input") input: CreateOrganizationInput,
  ) {
    const result = await this.organizationsService.create(
      user.id,
      input.name,
      input.slug,
    );
    return {
      organization: {
        ...result.organization,
        myRole: MemberRole.OWNER,
      },
    };
  }

  @Mutation(() => OrganizationModel)
  @UseGuards(GqlAuthGuard, OrgMemberGuard)
  async updateOrganization(
    @CurrentUser() user: AuthUser,
    @Args("input") input: UpdateOrganizationInput,
  ) {
    const org = await this.organizationsService.update(
      user.id,
      input.organizationId,
      { name: input.name, slug: input.slug },
    );
    const membership = await this.organizationsService.getMembership(
      org.id,
      user.id,
    );
    return { ...org, myRole: fromPrismaRole(membership.role) };
  }

  @Mutation(() => InvitationModel)
  @UseGuards(GqlAuthGuard, OrgMemberGuard)
  async createInvitation(
    @CurrentUser() user: AuthUser,
    @Args("input") input: CreateInvitationInput,
  ) {
    const invitation = await this.invitationsService.create(
      user.id,
      input.organizationId,
      input.email,
      input.role,
      input.workspaceId,
    );
    return {
      id: invitation.id,
      token: invitation.token,
      email: invitation.email,
      role: fromPrismaRole(invitation.role),
      expiresAt: invitation.expiresAt,
    };
  }

  @Mutation(() => AcceptInvitationPayload)
  @UseGuards(GqlAuthGuard)
  async acceptInvitation(
    @CurrentUser() user: AuthUser,
    @Args("token") token: string,
  ) {
    const result = await this.invitationsService.accept(
      user.id,
      user.email,
      token,
    );
    const membership = await this.organizationsService.getMembership(
      result.organization.id,
      user.id,
    );
    return {
      organization: {
        ...result.organization,
        myRole: fromPrismaRole(membership.role),
      },
      workspace: result.workspace
        ? {
            id: result.workspace.id,
            name: result.workspace.name,
            slug: result.workspace.slug,
            orgSlug: result.organization.slug,
          }
        : null,
    };
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, OrgMemberGuard)
  async removeOrganizationMember(
    @CurrentUser() user: AuthUser,
    @Args("input") input: RemoveOrganizationMemberInput,
  ) {
    return this.organizationsService.removeMember(
      user.id,
      input.organizationId,
      input.userId,
    );
  }
}
