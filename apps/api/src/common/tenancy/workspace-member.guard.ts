import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { fromPrismaRole } from "./member-role.enum";
import {
  getGqlContext,
  requireUser,
} from "./gql-auth.guard";

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = getGqlContext(context);
    const user = requireUser(gqlCtx);
    const args = context.getArgByIndex(1) as {
      orgSlug?: string;
      workspaceSlug?: string;
      workspaceId?: string;
      input?: {
        orgSlug?: string;
        workspaceSlug?: string;
        workspaceId?: string;
      };
    };

    const workspaceId = args.workspaceId ?? args.input?.workspaceId;
    const orgSlug = args.orgSlug ?? args.input?.orgSlug;
    const workspaceSlug = args.workspaceSlug ?? args.input?.workspaceSlug;

    let workspace:
      | {
          id: string;
          organizationId: string;
          slug: string;
          organization: { slug: string };
        }
      | null = null;

    if (workspaceId) {
      workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { organization: { select: { slug: true } } },
      });
    } else if (orgSlug && workspaceSlug) {
      const org = await this.prisma.organization.findUnique({
        where: { slug: orgSlug },
      });
      if (!org) {
        throw new ForbiddenException("Organization not found");
      }
      workspace = await this.prisma.workspace.findUnique({
        where: {
          organizationId_slug: {
            organizationId: org.id,
            slug: workspaceSlug,
          },
        },
        include: { organization: { select: { slug: true } } },
      });
    } else {
      throw new ForbiddenException("Workspace identifier required");
    }

    if (!workspace) {
      throw new ForbiddenException("Workspace not found");
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException("Not a member of this workspace");
    }

    gqlCtx.workspaceMembership = {
      workspaceId: workspace.id,
      organizationId: workspace.organizationId,
      role: fromPrismaRole(membership.role),
    };

    gqlCtx.orgMembership = gqlCtx.orgMembership ?? {
      organizationId: workspace.organizationId,
      role: fromPrismaRole(membership.role),
    };

    return true;
  }
}
