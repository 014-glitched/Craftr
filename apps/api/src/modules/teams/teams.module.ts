import { Module, forwardRef } from "@nestjs/common";
import { OrganizationsModule } from "../organizations/organizations.module";
import { TeamsResolver } from "./teams.resolver";
import { TeamsService } from "./teams.service";

@Module({
  imports: [forwardRef(() => OrganizationsModule)],
  providers: [TeamsService, TeamsResolver],
  exports: [TeamsService],
})
export class TeamsModule {}
