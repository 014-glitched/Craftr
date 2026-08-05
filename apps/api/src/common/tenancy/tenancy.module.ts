import { Global, Module } from "@nestjs/common";
import { AuthModule } from "../../modules/auth/auth.module";
import { GqlAuthGuard } from "./gql-auth.guard";
import { OrgMemberGuard } from "./org-member.guard";
import { WorkspaceMemberGuard } from "./workspace-member.guard";
import { TeamMemberGuard } from "./team-member.guard";

@Global()
@Module({
  imports: [AuthModule],
  providers: [
    GqlAuthGuard,
    OrgMemberGuard,
    WorkspaceMemberGuard,
    TeamMemberGuard,
  ],
  exports: [
    AuthModule,
    GqlAuthGuard,
    OrgMemberGuard,
    WorkspaceMemberGuard,
    TeamMemberGuard,
  ],
})
export class TenancyModule {}
