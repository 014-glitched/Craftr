import { Module } from "@nestjs/common";
import { OrganizationsModule } from "../organizations/organizations.module";
import { WorkspacesResolver } from "./workspaces.resolver";
import { WorkspacesService } from "./workspaces.service";

@Module({
  imports: [OrganizationsModule],
  providers: [WorkspacesService, WorkspacesResolver],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
