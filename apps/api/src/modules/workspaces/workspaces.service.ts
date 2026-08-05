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
} from "../../common/tenancy/member-role.enum";
import {
  createWorkspaceSchema,
  slugifyName,
  updateWorkspaceSchema,
} from "@craftr/validation";
import { parseInput } from "../../common/validation/parse-input";
import { uniqueWorkspaceSlug } from "../../common/tenancy/slug.util";
import { OrganizationsService } from "../organizations/organizations.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
    private readonly auditService: AuditService,
  ) {}

  /** Throws if the workspace is archived (blocks writes). */
  assertActive(workspace: { archivedAt: Date | null; name?: string }) {
    if (workspace.archivedAt) {
      throw new BadRequestException(
        workspace.name
          ? `Workspace "${workspace.name}" is archived`
          : "Workspace is archived",
      );
    }
  }

  async listForUser(
    userId: string,
    organizationId: string,
    includeArchived = false,
  ) {
    await this.organizationsService.requireOrgRole(
      userId,
      organizationId,
      MemberRole.MEMBER,
    );

    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId,
        workspace: {
          organizationId,
          ...(includeArchived ? {} : { archivedAt: null }),
        },
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
        orgMembership &&
        hasMinRole(fromPrismaRole(orgMembership.role), MemberRole.ADMIN)
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

      await this.auditService.record(
        {
          organizationId,
          workspaceId: workspace.id,
          actorUserId: userId,
          action: AuditAction.WORKSPACE_CREATED,
          entityType: "Workspace",
          entityId: workspace.id,
          summary: `Created workspace "${trimmed}"`,
          metadata: { slug },
        },
        tx,
      );

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
    this.assertActive(workspace);

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

    await this.auditService.record({
      organizationId: workspace.organizationId,
      workspaceId,
      actorUserId: userId,
      action: AuditAction.WORKSPACE_UPDATED,
      entityType: "Workspace",
      entityId: workspaceId,
      summary: `Updated workspace "${updated.name}"`,
      metadata: updateData,
    });

    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: workspace.organizationId },
    });

    return { ...updated, orgSlug: org.slug };
  }

  async archive(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.archivedAt) {
      throw new BadRequestException("Workspace is already archived");
    }

    await this.organizationsService.requireOrgRole(
      userId,
      workspace.organizationId,
      MemberRole.ADMIN,
    );

    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { archivedAt: new Date() },
    });

    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    await this.auditService.record({
      organizationId: workspace.organizationId,
      workspaceId,
      actorUserId: userId,
      action: AuditAction.WORKSPACE_ARCHIVED,
      entityType: "Workspace",
      entityId: workspaceId,
      summary: `${actor?.name ?? actor?.email ?? "User"} archived workspace "${workspace.name}"`,
      metadata: {
        slug: workspace.slug,
        actorName: actor?.name ?? null,
        actorEmail: actor?.email ?? null,
      },
    });

    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: workspace.organizationId },
    });

    return { ...updated, orgSlug: org.slug };
  }

  async restore(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");
    if (!workspace.archivedAt) {
      throw new BadRequestException("Workspace is not archived");
    }

    await this.organizationsService.requireOrgRole(
      userId,
      workspace.organizationId,
      MemberRole.ADMIN,
    );

    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { archivedAt: null },
    });

    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    await this.auditService.record({
      organizationId: workspace.organizationId,
      workspaceId,
      actorUserId: userId,
      action: AuditAction.WORKSPACE_RESTORED,
      entityType: "Workspace",
      entityId: workspaceId,
      summary: `${actor?.name ?? actor?.email ?? "User"} restored workspace "${workspace.name}"`,
      metadata: {
        slug: workspace.slug,
        actorName: actor?.name ?? null,
        actorEmail: actor?.email ?? null,
      },
    });

    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: workspace.organizationId },
    });

    return { ...updated, orgSlug: org.slug };
  }

  async listMembers(userId: string, workspaceId: string) {
    await this.requireWorkspaceMember(userId, workspaceId);

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
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

  private async requireWorkspaceMember(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this workspace");
    }
    return membership;
  }
}
