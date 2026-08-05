import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { fromPrismaRole } from "./member-role.enum";
import { getGqlContext, requireUser } from "./gql-auth.guard";

type TeamArgs = {
  teamId?: string;
  orgSlug?: string;
  workspaceSlug?: string;
  teamSlug?: string;
  input?: {
    teamId?: string;
    orgSlug?: string;
    workspaceSlug?: string;
    teamSlug?: string;
  };
};

@Injectable()
export class TeamMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = getGqlContext(context);
    const user = requireUser(gqlCtx);
    const args = context.getArgByIndex(1) as TeamArgs;

    const teamId = args.teamId ?? args.input?.teamId;
    const orgSlug = args.orgSlug ?? args.input?.orgSlug;
    const workspaceSlug = args.workspaceSlug ?? args.input?.workspaceSlug;
    const teamSlug = args.teamSlug ?? args.input?.teamSlug;

    let team: {
      id: string;
      workspaceId: string;
      slug: string;
      workspace: {
        id: string;
        organizationId: string;
        slug: string;
        organization: { slug: string };
      };
    } | null = null;

    if (teamId) {
      team = await this.prisma.team.findUnique({
        where: { id: teamId },
        include: {
          workspace: {
            include: { organization: { select: { slug: true } } },
          },
        },
      });
    } else if (orgSlug && workspaceSlug && teamSlug) {
      const org = await this.prisma.organization.findUnique({
        where: { slug: orgSlug },
      });
      if (!org) throw new ForbiddenException("Organization not found");

      const workspace = await this.prisma.workspace.findUnique({
        where: {
          organizationId_slug: {
            organizationId: org.id,
            slug: workspaceSlug,
          },
        },
      });
      if (!workspace) throw new ForbiddenException("Workspace not found");

      team = await this.prisma.team.findUnique({
        where: {
          workspaceId_slug: {
            workspaceId: workspace.id,
            slug: teamSlug,
          },
        },
        include: {
          workspace: {
            include: { organization: { select: { slug: true } } },
          },
        },
      });
    } else {
      throw new ForbiddenException("Team identifier required");
    }

    if (!team) {
      throw new ForbiddenException("Team not found");
    }

    const membership = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException("Not a member of this team");
    }

    gqlCtx.teamMembership = {
      teamId: team.id,
      workspaceId: team.workspaceId,
      organizationId: team.workspace.organizationId,
      role: fromPrismaRole(membership.role),
    };

    gqlCtx.workspaceMembership = gqlCtx.workspaceMembership ?? {
      workspaceId: team.workspaceId,
      organizationId: team.workspace.organizationId,
      role: fromPrismaRole(membership.role),
    };

    return true;
  }
}
