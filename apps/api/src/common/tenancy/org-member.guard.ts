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

type OrgArgs = {
  organizationId?: string;
  slug?: string;
  orgSlug?: string;
  input?: {
    organizationId?: string;
    slug?: string;
    orgSlug?: string;
  };
};

function resolveOrgIdentifiers(args: OrgArgs) {
  return {
    organizationId: args.organizationId ?? args.input?.organizationId,
    slug: args.slug ?? args.orgSlug ?? args.input?.slug ?? args.input?.orgSlug,
  };
}

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = getGqlContext(context);
    const user = requireUser(gqlCtx);
    const args = context.getArgByIndex(1) as OrgArgs;
    const { organizationId, slug } = resolveOrgIdentifiers(args);

    if (!organizationId && !slug) {
      throw new ForbiddenException("Organization identifier required");
    }

    const org = organizationId
      ? await this.prisma.organization.findUnique({ where: { id: organizationId } })
      : await this.prisma.organization.findUnique({ where: { slug: slug! } });

    if (!org) {
      throw new ForbiddenException("Organization not found");
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException("Not a member of this organization");
    }

    gqlCtx.orgMembership = {
      organizationId: org.id,
      role: fromPrismaRole(membership.role),
    };

    return true;
  }
}
