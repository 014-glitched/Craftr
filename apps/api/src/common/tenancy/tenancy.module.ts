import { Global, Module } from "@nestjs/common";
import { AuthModule } from "../../modules/auth/auth.module";
import { GqlAuthGuard } from "./gql-auth.guard";
import { OrgMemberGuard } from "./org-member.guard";
import { WorkspaceMemberGuard } from "./workspace-member.guard";

@Global()
@Module({
  imports: [AuthModule],
  providers: [GqlAuthGuard, OrgMemberGuard, WorkspaceMemberGuard],
  exports: [AuthModule, GqlAuthGuard, OrgMemberGuard, WorkspaceMemberGuard],
})
export class TenancyModule {}
