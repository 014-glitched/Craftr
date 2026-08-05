import { Module, forwardRef } from "@nestjs/common";
import { InvitationsService } from "./invitations.service";
import { OrganizationsResolver } from "./organizations.resolver";
import { OrganizationsService } from "./organizations.service";
import { TeamsModule } from "../teams/teams.module";

@Module({
  imports: [forwardRef(() => TeamsModule)],
  providers: [
    OrganizationsService,
    InvitationsService,
    OrganizationsResolver,
  ],
  exports: [OrganizationsService, InvitationsService],
})
export class OrganizationsModule {}
