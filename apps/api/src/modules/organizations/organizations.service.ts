import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  fromPrismaRole,
  hasMinRole,
  MemberRole,
  toPrismaRole,
} from "../../common/tenancy/member-role.enum";
import {
  createOrganizationSchema,
  slugifyName,
  updateOrganizationSchema,
} from "@craftr/validation";
import { parseInput } from "../../common/validation/parse-input";
import {
  uniqueOrgSlug,
  uniqueWorkspaceSlug,
} from "../../common/tenancy/slug.util";

const DEFAULT_WORKSPACE_NAME = "General";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((m) => ({
      ...m.organization,
      myRole: fromPrismaRole(m.role),
    }));
  }

  async getBySlug(userId: string, slug: string) {
    const org = await this.prisma.organization.findUnique({ where: { slug } });
    if (!org) throw new NotFoundException("Organization not found");

    const membership = await this.getMembership(org.id, userId);
    return { ...org, myRole: fromPrismaRole(membership.role) };
  }

  async create(userId: string, name: string, slugInput?: string) {
    const input = parseInput(createOrganizationSchema, { name, slug: slugInput });
    const trimmed = input.name;
    const baseSlug = slugifyName(input.slug || trimmed);
    const slug = await uniqueOrgSlug(baseSlug, async (s) => {
      const existing = await this.prisma.organization.findUnique({ where: { slug: s } });
      return Boolean(existing);
    });

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: trimmed, slug },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId,
          role: "OWNER",
        },
      });

      const wsSlug = await uniqueWorkspaceSlug(
        slugifyName(DEFAULT_WORKSPACE_NAME),
        org.id,
        async (organizationId, s) => {
          const existing = await tx.workspace.findUnique({
            where: { organizationId_slug: { organizationId, slug: s } },
          });
          return Boolean(existing);
        },
      );

      const workspace = await tx.workspace.create({
        data: {
          organizationId: org.id,
          name: DEFAULT_WORKSPACE_NAME,
          slug: wsSlug,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: "OWNER",
        },
      });

      return { organization: org, defaultWorkspace: workspace };
    });
  }

  async update(
    userId: string,
    organizationId: string,
    data: { name?: string; slug?: string },
  ) {
    await this.requireOrgRole(userId, organizationId, MemberRole.ADMIN);

    const parsed = parseInput(updateOrganizationSchema, data);
    const updateData: { name?: string; slug?: string } = {};
    if (parsed.name !== undefined) {
      updateData.name = parsed.name;
    }
    if (parsed.slug !== undefined) {
      const base = slugifyName(parsed.slug);
      updateData.slug = await uniqueOrgSlug(base, async (s) => {
        const existing = await this.prisma.organization.findFirst({
          where: { slug: s, NOT: { id: organizationId } },
        });
        return Boolean(existing);
      });
    }

    return this.prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });
  }

  async listMembers(userId: string, organizationId: string) {
    await this.requireOrgRole(userId, organizationId, MemberRole.MEMBER);

    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return members.map((m) => ({
      id: m.id,
      role: fromPrismaRole(m.role),
      joinedAt: m.createdAt,
      user: m.user,
    }));
  }

  async removeMember(
    userId: string,
    organizationId: string,
    targetUserId: string,
  ) {
    await this.requireOrgRole(userId, organizationId, MemberRole.OWNER);

    if (userId === targetUserId) {
      const ownerCount = await this.prisma.organizationMember.count({
        where: { organizationId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException("Cannot remove the sole organization owner");
      }
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
    });
    if (!membership) {
      throw new NotFoundException("Member not found");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.organizationMember.delete({ where: { id: membership.id } });
      const workspaceIds = (
        await tx.workspace.findMany({
          where: { organizationId },
          select: { id: true },
        })
      ).map((w) => w.id);
      if (workspaceIds.length > 0) {
        await tx.workspaceMember.deleteMany({
          where: { userId: targetUserId, workspaceId: { in: workspaceIds } },
        });
      }
    });

    return true;
  }

  async getMembership(organizationId: string, userId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this organization");
    }
    return membership;
  }

  async requireOrgRole(
    userId: string,
    organizationId: string,
    minimum: MemberRole,
  ) {
    const membership = await this.getMembership(organizationId, userId);
    const role = fromPrismaRole(membership.role);
    if (!hasMinRole(role, minimum)) {
      throw new ForbiddenException("Insufficient organization permissions");
    }
    return membership;
  }

  roleToPrisma(role: MemberRole) {
    return toPrismaRole(role);
  }
}
