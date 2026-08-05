import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@craftr/database";
import { PrismaService } from "../../common/prisma/prisma.service";
import { fromPrismaRole, MemberRole } from "../../common/tenancy/member-role.enum";
import {
  AuditAction,
  type RecordAuditInput,
} from "./audit.types";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordAuditInput, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.auditLog.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId ?? null,
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary,
        metadata:
          input.metadata === undefined || input.metadata === null
            ? Prisma.JsonNull
            : (input.metadata as Prisma.InputJsonValue),
      },
    });
  }

  async listForWorkspace(
    userId: string,
    workspaceId: string,
    limit = 50,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, organizationId: true },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
    if (
      !membership ||
      fromPrismaRole(membership.role) !== MemberRole.OWNER
    ) {
      throw new ForbiddenException(
        "Only workspace owners can view audit logs",
      );
    }

    const take = Math.min(Math.max(limit, 1), 200);

    const rows = await this.prisma.auditLog.findMany({
      where: {
        organizationId: workspace.organizationId,
        OR: [
          { workspaceId },
          { workspaceId: null },
        ],
      },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    return this.mapRows(rows);
  }

  /**
   * Org-level trail for org OWNER/ADMIN. Includes archive/restore events for
   * every workspace (active or archived), which the workspace-scoped query
   * misses when the archived space is no longer selected.
   */
  async listForOrganization(
    userId: string,
    organizationId: string,
    limit = 50,
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!org) throw new NotFoundException("Organization not found");

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this organization");
    }
    const role = fromPrismaRole(membership.role);
    if (role !== MemberRole.OWNER && role !== MemberRole.ADMIN) {
      throw new ForbiddenException(
        "Only organization owners and admins can view organization audit logs",
      );
    }

    const take = Math.min(Math.max(limit, 1), 200);

    const rows = await this.prisma.auditLog.findMany({
      where: { organizationId },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    return this.mapRows(rows);
  }

  private mapRows(
    rows: Array<{
      id: string;
      organizationId: string;
      workspaceId: string | null;
      action: string;
      entityType: string;
      entityId: string | null;
      summary: string;
      metadata: Prisma.JsonValue;
      createdAt: Date;
      actor: { id: string; name: string; email: string };
    }>,
  ) {
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      workspaceId: row.workspaceId,
      action: row.action as AuditAction,
      entityType: row.entityType,
      entityId: row.entityId,
      summary: row.summary,
      metadata:
        row.metadata === null || row.metadata === undefined
          ? null
          : JSON.stringify(row.metadata),
      createdAt: row.createdAt,
      actor: row.actor,
    }));
  }
}
