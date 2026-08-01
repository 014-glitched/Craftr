import { Module } from "@nestjs/common";
import { InvitationsService } from "./invitations.service";
import { OrganizationsResolver } from "./organizations.resolver";
import { OrganizationsService } from "./organizations.service";

@Module({
  providers: [
    OrganizationsService,
    InvitationsService,
    OrganizationsResolver,
  ],
  exports: [OrganizationsService, InvitationsService],
})
export class OrganizationsModule {}
