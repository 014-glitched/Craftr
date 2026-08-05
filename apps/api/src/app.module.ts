import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import type { Request, Response } from "express";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { WorkspacesModule } from "./modules/workspaces/workspaces.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { AuditModule } from "./modules/audit/audit.module";
import { PrismaModule } from "./common/prisma/prisma.module";
import { TenancyModule } from "./common/tenancy/tenancy.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    PrismaModule,
    TenancyModule,
    AuditModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      playground: true,
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
      formatError: (formattedError) => ({
        message: formattedError.message,
        path: formattedError.path,
        extensions: {
          code: formattedError.extensions?.code,
        },
      }),
    }),
    AuthModule,
    HealthModule,
    OrganizationsModule,
    WorkspacesModule,
    TeamsModule,
  ],
})
export class AppModule {}
