import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  fromPrismaRole,
  hasMinRole,
  MemberRole,
} from "../../common/tenancy/member-role.enum";
import {
  createWorkspaceSchema,
  slugifyName,
  updateWorkspaceSchema,
} from "@craftr/validation";
import { parseInput } from "../../common/validation/parse-input";
import { uniqueWorkspaceSlug } from "../../common/tenancy/slug.util";
import { OrganizationsService } from "../organizations/organizations.service";

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async listForUser(userId: string, organizationId: string) {
    await this.organizationsService.requireOrgRole(
      userId,
      organizationId,
      MemberRole.MEMBER,
    );

    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId,
        workspace: { organizationId },
      },
      include: {
        workspace: { include: { organization: { select: { slug: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      orgSlug: m.workspace.organization.slug,
      myRole: fromPrismaRole(m.role),
    }));
  }

  async getBySlugs(userId: string, orgSlug: string, workspaceSlug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
    });
    if (!org) throw new NotFoundException("Organization not found");

    const workspace = await this.prisma.workspace.findUnique({
      where: {
        organizationId_slug: {
          organizationId: org.id,
          slug: workspaceSlug,
        },
      },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: workspace.id, userId },
      },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this workspace");
    }

    return {
      ...workspace,
      orgSlug: org.slug,
      myRole: fromPrismaRole(membership.role),
    };
  }

  async create(
    userId: string,
    organizationId: string,
    name: string,
    slugInput?: string,
  ) {
    await this.organizationsService.requireOrgRole(
      userId,
      organizationId,
      MemberRole.ADMIN,
    );

    const input = parseInput(createWorkspaceSchema, { name, slug: slugInput });
    const trimmed = input.name;
    const baseSlug = slugifyName(input.slug || trimmed);
    const slug = await uniqueWorkspaceSlug(
      baseSlug,
      organizationId,
      async (orgId, s) => {
        const existing = await this.prisma.workspace.findUnique({
          where: { organizationId_slug: { organizationId: orgId, slug: s } },
        });
        return Boolean(existing);
      },
    );

    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { organizationId, name: trimmed, slug },
      });

      const orgMembership = await tx.organizationMember.findUnique({
        where: {
          organizationId_userId: { organizationId, userId },
        },
      });

      const creatorRole =
        orgMembership && hasMinRole(fromPrismaRole(orgMembership.role), MemberRole.ADMIN)
          ? orgMembership.role
          : "ADMIN";

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: creatorRole,
        },
      });

      const org = await tx.organization.findUniqueOrThrow({
        where: { id: organizationId },
      });

      return { ...workspace, orgSlug: org.slug };
    });
  }

  async update(
    userId: string,
    workspaceId: string,
    data: { name?: string; slug?: string },
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    await this.organizationsService.requireOrgRole(
      userId,
      workspace.organizationId,
      MemberRole.ADMIN,
    );

    const parsed = parseInput(updateWorkspaceSchema, data);
    const updateData: { name?: string; slug?: string } = {};
    if (parsed.name !== undefined) {
      updateData.name = parsed.name;
    }
    if (parsed.slug !== undefined) {
      const base = slugifyName(parsed.slug);
      updateData.slug = await uniqueWorkspaceSlug(
        base,
        workspace.organizationId,
        async (organizationId, s) => {
          const existing = await this.prisma.workspace.findFirst({
            where: {
              organizationId,
              slug: s,
              NOT: { id: workspaceId },
            },
          });
          return Boolean(existing);
        },
      );
    }

    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
    });

    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: workspace.organizationId },
    });

    return { ...updated, orgSlug: org.slug };
  }
}
