import { UseGuards } from "@nestjs/common";
import { Args, Int, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser, type AuthUser } from "../auth/auth.types";
import { GqlAuthGuard } from "../../common/tenancy/gql-auth.guard";
import { AuditService } from "./audit.service";
import { AuditLogModel } from "./audit.types";

@Resolver()
export class AuditResolver {
  constructor(private readonly auditService: AuditService) {}

  @Query(() => [AuditLogModel])
  @UseGuards(GqlAuthGuard)
  async workspaceAuditLogs(
    @CurrentUser() user: AuthUser,
    @Args("workspaceId", { type: () => String }) workspaceId: string,
    @Args("limit", { type: () => Int, nullable: true, defaultValue: 50 })
    limit?: number,
  ) {
    return this.auditService.listForWorkspace(
      user.id,
      workspaceId,
      limit ?? 50,
    );
  }

  @Query(() => [AuditLogModel])
  @UseGuards(GqlAuthGuard)
  async organizationAuditLogs(
    @CurrentUser() user: AuthUser,
    @Args("organizationId", { type: () => String }) organizationId: string,
    @Args("limit", { type: () => Int, nullable: true, defaultValue: 50 })
    limit?: number,
  ) {
    return this.auditService.listForOrganization(
      user.id,
      organizationId,
      limit ?? 50,
    );
  }
}
