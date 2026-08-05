import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import {
  createTeamOwnershipChangeSchema,
  createTeamSchema,
  respondTeamOwnershipChangeSchema,
  slugifyName,
  updateTeamSchema,
} from "@craftr/validation";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  fromPrismaRole,
  hasMinRole,
  MemberRole,
  toPrismaRole,
} from "../../common/tenancy/member-role.enum";
import { uniqueTeamSlug } from "../../common/tenancy/slug.util";
import { parseInput } from "../../common/validation/parse-input";
import { OrganizationsService } from "../organizations/organizations.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import {
  TeamOwnershipChangeStatus,
  TeamOwnershipChangeType,
} from "./teams.types";

const OWNERSHIP_CHANGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const;

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OrganizationsService))
    private readonly organizationsService: OrganizationsService,
    private readonly auditService: AuditService,
  ) {}

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

  private async getTeamOrThrow(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        workspace: {
          include: { organization: { select: { id: true, slug: true } } },
        },
      },
    });
    if (!team) throw new NotFoundException("Team not found");
    return team;
  }

  /** Org ADMIN+ or team ADMIN+ may manage the team. */
  async requireTeamManage(userId: string, teamId: string) {
    const team = await this.getTeamOrThrow(teamId);
    if (team.workspace.archivedAt) {
      throw new BadRequestException(
        `Workspace "${team.workspace.name}" is archived`,
      );
    }

    try {
      await this.organizationsService.requireOrgRole(
        userId,
        team.workspace.organizationId,
        MemberRole.ADMIN,
      );
      return team;
    } catch {
      /* fall through to team role */
    }

    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (
      !membership ||
      !hasMinRole(fromPrismaRole(membership.role), MemberRole.ADMIN)
    ) {
      throw new ForbiddenException("Insufficient team permissions");
    }
    return team;
  }

  async listMyTeams(userId: string, workspaceId: string) {
    await this.requireWorkspaceMember(userId, workspaceId);

    const memberships = await this.prisma.teamMember.findMany({
      where: {
        userId,
        team: { workspaceId },
      },
      include: {
        team: {
          include: {
            workspace: {
              include: { organization: { select: { slug: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      ...m.team,
      workspaceSlug: m.team.workspace.slug,
      orgSlug: m.team.workspace.organization.slug,
      myRole: fromPrismaRole(m.role),
    }));
  }

  async listWorkspaceTeams(userId: string, workspaceId: string) {
    await this.requireWorkspaceMember(userId, workspaceId);

    const teams = await this.prisma.team.findMany({
      where: { workspaceId },
      include: {
        workspace: {
          include: { organization: { select: { slug: true } } },
        },
        members: {
          where: { userId },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return teams.map((t) => ({
      ...t,
      workspaceSlug: t.workspace.slug,
      orgSlug: t.workspace.organization.slug,
      myRole: t.members[0] ? fromPrismaRole(t.members[0].role) : null,
    }));
  }

  async getBySlugs(
    userId: string,
    orgSlug: string,
    workspaceSlug: string,
    teamSlug: string,
  ) {
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

    const team = await this.prisma.team.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: workspace.id,
          slug: teamSlug,
        },
      },
    });
    if (!team) throw new NotFoundException("Team not found");

    const membership = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId: team.id, userId },
      },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this team");
    }

    return {
      ...team,
      workspaceSlug: workspace.slug,
      orgSlug: org.slug,
      myRole: fromPrismaRole(membership.role),
    };
  }

  async create(
    userId: string,
    workspaceId: string,
    name: string,
    slugInput?: string,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { organization: { select: { id: true, slug: true } } },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.archivedAt) {
      throw new BadRequestException(
        `Workspace "${workspace.name}" is archived`,
      );
    }

    await this.organizationsService.requireOrgRole(
      userId,
      workspace.organizationId,
      MemberRole.OWNER,
    );
    await this.requireWorkspaceMember(userId, workspaceId);

    const input = parseInput(createTeamSchema, { name, slug: slugInput });
    const trimmed = input.name;
    const baseSlug = slugifyName(input.slug || trimmed);
    const slug = await uniqueTeamSlug(
      baseSlug,
      workspaceId,
      async (wsId, s) => {
        const existing = await this.prisma.team.findUnique({
          where: { workspaceId_slug: { workspaceId: wsId, slug: s } },
        });
        return Boolean(existing);
      },
    );

    return this.prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: { workspaceId, name: trimmed, slug },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId,
          role: "OWNER",
        },
      });

      await this.auditService.record(
        {
          organizationId: workspace.organizationId,
          workspaceId,
          actorUserId: userId,
          action: AuditAction.TEAM_CREATED,
          entityType: "Team",
          entityId: team.id,
          summary: `Created team "${trimmed}"`,
          metadata: { slug, name: trimmed },
        },
        tx,
      );

      return {
        ...team,
        workspaceSlug: workspace.slug,
        orgSlug: workspace.organization.slug,
        myRole: MemberRole.OWNER,
      };
    });
  }

  async update(
    userId: string,
    teamId: string,
    data: { name?: string; slug?: string },
  ) {
    const team = await this.requireTeamManage(userId, teamId);
    const parsed = parseInput(updateTeamSchema, data);

    const updateData: { name?: string; slug?: string } = {};
    if (parsed.name !== undefined) {
      updateData.name = parsed.name;
    }
    if (parsed.slug !== undefined) {
      const base = slugifyName(parsed.slug);
      updateData.slug = await uniqueTeamSlug(
        base,
        team.workspaceId,
        async (workspaceId, s) => {
          const existing = await this.prisma.team.findFirst({
            where: {
              workspaceId,
              slug: s,
              NOT: { id: teamId },
            },
          });
          return Boolean(existing);
        },
      );
    }

    const updated = await this.prisma.team.update({
      where: { id: teamId },
      data: updateData,
    });

    await this.auditService.record({
      organizationId: team.workspace.organizationId,
      workspaceId: team.workspaceId,
      actorUserId: userId,
      action: AuditAction.TEAM_UPDATED,
      entityType: "Team",
      entityId: teamId,
      summary: `Updated team "${updated.name}"`,
      metadata: updateData,
    });

    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    return {
      ...updated,
      workspaceSlug: team.workspace.slug,
      orgSlug: team.workspace.organization.slug,
      myRole: membership ? fromPrismaRole(membership.role) : null,
    };
  }

  async listMembers(userId: string, teamId: string) {
    await this.getByTeamAccess(userId, teamId);

    const members = await this.prisma.teamMember.findMany({
      where: { teamId },
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

  /** Team member or org ADMIN+ can view team members. */
  private async getByTeamAccess(userId: string, teamId: string) {
    const team = await this.getTeamOrThrow(teamId);

    const teamMembership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (teamMembership) return team;

    await this.organizationsService.requireOrgRole(
      userId,
      team.workspace.organizationId,
      MemberRole.ADMIN,
    );
    return team;
  }

  async addMember(
    actorId: string,
    teamId: string,
    targetUserId: string,
    role: MemberRole,
  ) {
    const team = await this.requireTeamManage(actorId, teamId);

    if (role === MemberRole.OWNER) {
      throw new BadRequestException(
        "Use an ownership offer or request to add another owner",
      );
    }

    const wsMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: team.workspaceId,
          userId: targetUserId,
        },
      },
    });
    if (!wsMember) {
      throw new BadRequestException(
        "User must be a workspace member before joining a team",
      );
    }

    const existing = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: targetUserId },
      },
    });
    if (existing) {
      throw new BadRequestException("User is already a team member");
    }

    const created = await this.prisma.teamMember.create({
      data: {
        teamId,
        userId: targetUserId,
        role: toPrismaRole(role),
      },
      include: {
        user: { select: userSelect },
      },
    });

    await this.auditService.record({
      organizationId: team.workspace.organizationId,
      workspaceId: team.workspaceId,
      actorUserId: actorId,
      action: AuditAction.TEAM_MEMBER_ADDED,
      entityType: "TeamMember",
      entityId: created.id,
      summary: `Added ${created.user.name} to team "${team.name}" as ${role}`,
      metadata: {
        teamId,
        targetUserId,
        role,
        targetEmail: created.user.email,
      },
    });

    return {
      id: created.id,
      role: fromPrismaRole(created.role),
      joinedAt: created.createdAt,
      user: created.user,
    };
  }

  async removeMember(actorId: string, teamId: string, targetUserId: string) {
    const isSelf = actorId === targetUserId;
    if (isSelf) {
      const team = await this.getTeamOrThrow(teamId);
      const membership = await this.prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: actorId } },
      });
      if (!membership) {
        throw new NotFoundException("Team member not found");
      }
      await this.assertNotSoleOwner(
      teamId,
      membership.role,
      "Transfer ownership or promote another owner before leaving this team",
    );
      await this.prisma.$transaction(async (tx) => {
        await tx.teamMember.delete({ where: { id: membership.id } });
        await tx.teamOwnershipChange.updateMany({
          where: {
            teamId,
            status: "PENDING",
            OR: [
              { initiatorUserId: actorId },
              { counterpartyUserId: actorId },
            ],
          },
          data: { status: "CANCELLED", resolvedAt: new Date() },
        });
        await this.auditService.record(
          {
            organizationId: team.workspace.organizationId,
            workspaceId: team.workspaceId,
            actorUserId: actorId,
            action: AuditAction.TEAM_MEMBER_REMOVED,
            entityType: "TeamMember",
            entityId: membership.id,
            summary: `Left team "${team.name}"`,
            metadata: { teamId, targetUserId: actorId, self: true },
          },
          tx,
        );
      });
      return true;
    }

    const team = await this.requireTeamManage(actorId, teamId);

    const membership = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: targetUserId },
      },
    });
    if (!membership) {
      throw new NotFoundException("Team member not found");
    }

    await this.assertNotSoleOwner(
      teamId,
      membership.role,
      "Cannot remove the sole team owner — transfer ownership first",
    );

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { name: true, email: true },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.teamMember.delete({ where: { id: membership.id } });
      await tx.teamOwnershipChange.updateMany({
        where: {
          teamId,
          status: "PENDING",
          OR: [
            { initiatorUserId: targetUserId },
            { counterpartyUserId: targetUserId },
          ],
        },
        data: { status: "CANCELLED", resolvedAt: new Date() },
      });
      await this.auditService.record(
        {
          organizationId: team.workspace.organizationId,
          workspaceId: team.workspaceId,
          actorUserId: actorId,
          action: AuditAction.TEAM_MEMBER_REMOVED,
          entityType: "TeamMember",
          entityId: membership.id,
          summary: `Removed ${targetUser?.name ?? targetUserId} from team "${team.name}"`,
          metadata: {
            teamId,
            targetUserId,
            targetEmail: targetUser?.email,
          },
        },
        tx,
      );
    });
    return true;
  }

  private async assertNotSoleOwner(
    teamId: string,
    role: string,
    message: string,
  ) {
    if (role !== "OWNER") return;
    const ownerCount = await this.prisma.teamMember.count({
      where: { teamId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      throw new BadRequestException(message);
    }
  }

  /**
   * Blocks org removal when the user is the sole OWNER of any team in the org,
   * then deletes their team memberships and cancels pending ownership changes.
   */
  async purgeUserTeamsInOrganization(
    userId: string,
    organizationId: string,
  ) {
    const teams = await this.prisma.team.findMany({
      where: { workspace: { organizationId } },
      select: {
        id: true,
        name: true,
        members: {
          where: { role: "OWNER" },
          select: { userId: true },
        },
      },
    });

    const soleOwned = teams.filter(
      (team) =>
        team.members.length === 1 && team.members[0]?.userId === userId,
    );
    if (soleOwned.length > 0) {
      throw new BadRequestException(
        `Transfer ownership of team(s) first: ${soleOwned
          .map((team) => team.name)
          .join(", ")}`,
      );
    }

    const teamIds = teams.map((team) => team.id);
    if (teamIds.length === 0) return;

    await this.prisma.teamMember.deleteMany({
      where: { userId, teamId: { in: teamIds } },
    });
    await this.prisma.teamOwnershipChange.updateMany({
      where: {
        teamId: { in: teamIds },
        status: "PENDING",
        OR: [{ initiatorUserId: userId }, { counterpartyUserId: userId }],
      },
      data: { status: "CANCELLED", resolvedAt: new Date() },
    });
  }

  async listOwnershipChanges(userId: string, teamId: string) {
    await this.getByTeamAccess(userId, teamId);
    await this.expirePendingForTeam(teamId);

    const rows = await this.prisma.teamOwnershipChange.findMany({
      where: { teamId },
      include: {
        team: { select: { name: true } },
        initiator: { select: userSelect },
        counterparty: { select: userSelect },
        responder: { select: userSelect },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return rows.map((r) => this.mapOwnershipChange(r));
  }

  async listMyOwnershipInbox(userId: string) {
    await this.expirePendingForUser(userId);

    const ownerTeamIds = (
      await this.prisma.teamMember.findMany({
        where: { userId, role: "OWNER" },
        select: { teamId: true },
      })
    ).map((m) => m.teamId);

    const rows = await this.prisma.teamOwnershipChange.findMany({
      where: {
        status: "PENDING",
        OR: [
          { counterpartyUserId: userId },
          {
            type: "REQUEST",
            teamId: { in: ownerTeamIds },
            initiatorUserId: { not: userId },
          },
        ],
      },
      include: {
        team: { select: { name: true } },
        initiator: { select: userSelect },
        counterparty: { select: userSelect },
        responder: { select: userSelect },
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) => this.mapOwnershipChange(r));
  }

  async createOwnershipChange(
    userId: string,
    raw: {
      teamId: string;
      type: TeamOwnershipChangeType;
      counterpartyUserId?: string;
      message?: string;
    },
  ) {
    const input = parseInput(createTeamOwnershipChangeSchema, raw);
    const team = await this.getTeamOrThrow(input.teamId);

    const actorMembership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: input.teamId, userId } },
    });
    if (!actorMembership) {
      throw new ForbiddenException("Not a member of this team");
    }

    const wsMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: team.workspaceId,
          userId,
        },
      },
    });
    if (!wsMember) {
      throw new ForbiddenException("Not a member of this workspace");
    }

    if (
      input.type === "TRANSFER" ||
      input.type === "CO_OWNER"
    ) {
      if (fromPrismaRole(actorMembership.role) !== MemberRole.OWNER) {
        throw new ForbiddenException("Only a team owner can offer ownership");
      }
      const targetId = input.counterpartyUserId!;
      if (targetId === userId) {
        throw new BadRequestException("Cannot offer ownership to yourself");
      }

      const target = await this.prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: input.teamId, userId: targetId } },
      });
      if (!target) {
        throw new BadRequestException("Counterparty must already be a team member");
      }
      if (target.role === "OWNER" && input.type === "CO_OWNER") {
        throw new BadRequestException("User is already a team owner");
      }
      if (target.role === "OWNER" && input.type === "TRANSFER") {
        throw new BadRequestException(
          "User is already an owner — leave the team after transfer if you want to step down",
        );
      }

      await this.cancelPendingOffers(input.teamId, userId, targetId);

      const created = await this.prisma.teamOwnershipChange.create({
        data: {
          teamId: input.teamId,
          type: input.type,
          initiatorUserId: userId,
          counterpartyUserId: targetId,
          message: input.message,
          expiresAt: new Date(Date.now() + OWNERSHIP_CHANGE_TTL_MS),
        },
        include: {
          team: { select: { name: true } },
          initiator: { select: userSelect },
          counterparty: { select: userSelect },
          responder: { select: userSelect },
        },
      });
      await this.auditService.record({
        organizationId: team.workspace.organizationId,
        workspaceId: team.workspaceId,
        actorUserId: userId,
        action: AuditAction.OWNERSHIP_OFFERED,
        entityType: "TeamOwnershipChange",
        entityId: created.id,
        summary: `Offered ${input.type} ownership on "${team.name}"`,
        metadata: {
          type: input.type,
          teamId: team.id,
          counterpartyUserId: targetId,
        },
      });
      return this.mapOwnershipChange(created);
    }

    // REQUEST
    if (fromPrismaRole(actorMembership.role) === MemberRole.OWNER) {
      throw new BadRequestException("You are already a team owner");
    }

    const existingPending = await this.prisma.teamOwnershipChange.findFirst({
      where: {
        teamId: input.teamId,
        type: "REQUEST",
        initiatorUserId: userId,
        status: "PENDING",
      },
    });
    if (existingPending) {
      throw new BadRequestException("You already have a pending ownership request");
    }

    const created = await this.prisma.teamOwnershipChange.create({
      data: {
        teamId: input.teamId,
        type: "REQUEST",
        initiatorUserId: userId,
        message: input.message,
        expiresAt: new Date(Date.now() + OWNERSHIP_CHANGE_TTL_MS),
      },
      include: {
        team: { select: { name: true } },
        initiator: { select: userSelect },
        counterparty: { select: userSelect },
        responder: { select: userSelect },
      },
    });
    await this.auditService.record({
      organizationId: team.workspace.organizationId,
      workspaceId: team.workspaceId,
      actorUserId: userId,
      action: AuditAction.OWNERSHIP_REQUESTED,
      entityType: "TeamOwnershipChange",
      entityId: created.id,
      summary: `Requested ownership of "${team.name}"`,
      metadata: { teamId: team.id, type: "REQUEST" },
    });
    return this.mapOwnershipChange(created);
  }

  async respondOwnershipChange(
    userId: string,
    raw: { changeId: string; accept: boolean },
  ) {
    const input = parseInput(respondTeamOwnershipChangeSchema, raw);
    const change = await this.prisma.teamOwnershipChange.findUnique({
      where: { id: input.changeId },
      include: {
        team: { select: { name: true } },
        initiator: { select: userSelect },
        counterparty: { select: userSelect },
        responder: { select: userSelect },
      },
    });
    if (!change) throw new NotFoundException("Ownership change not found");

    const team = await this.getTeamOrThrow(change.teamId);

    if (change.status !== "PENDING" || change.expiresAt <= new Date()) {
      if (change.status === "PENDING") {
        await this.prisma.teamOwnershipChange.update({
          where: { id: change.id },
          data: { status: "CANCELLED", resolvedAt: new Date() },
        });
      }
      throw new BadRequestException("This ownership change is no longer pending");
    }

    if (change.type === "REQUEST") {
      if (change.initiatorUserId === userId) {
        throw new BadRequestException("Cannot respond to your own request");
      }

      const responderMembership = await this.prisma.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: change.teamId, userId },
        },
      });
      const isTeamOwner =
        Boolean(responderMembership) &&
        fromPrismaRole(responderMembership!.role) === MemberRole.OWNER;

      let isOrgOwner = false;
      if (!isTeamOwner) {
        const team = await this.getTeamOrThrow(change.teamId);
        try {
          await this.organizationsService.requireOrgRole(
            userId,
            team.workspace.organizationId,
            MemberRole.OWNER,
          );
          isOrgOwner = true;
        } catch {
          isOrgOwner = false;
        }
      }

      if (!isTeamOwner && !isOrgOwner) {
        throw new ForbiddenException(
          "Only a team owner or organization owner can approve this request",
        );
      }
    } else {
      if (change.counterpartyUserId !== userId) {
        throw new ForbiddenException(
          "Only the offered member can accept or decline",
        );
      }
    }

    if (!input.accept) {
      const declined = await this.prisma.teamOwnershipChange.update({
        where: { id: change.id },
        data: {
          status: "DECLINED",
          responderUserId: userId,
          resolvedAt: new Date(),
        },
        include: {
          team: { select: { name: true } },
          initiator: { select: userSelect },
          counterparty: { select: userSelect },
          responder: { select: userSelect },
        },
      });
      await this.auditService.record({
        organizationId: team.workspace.organizationId,
        workspaceId: team.workspaceId,
        actorUserId: userId,
        action: AuditAction.OWNERSHIP_DECLINED,
        entityType: "TeamOwnershipChange",
        entityId: change.id,
        summary: `Declined ${change.type} ownership on "${team.name}"`,
        metadata: { type: change.type, teamId: team.id },
      });
      return this.mapOwnershipChange(declined);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (change.type === "TRANSFER") {
        const initiator = await tx.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: change.teamId,
              userId: change.initiatorUserId,
            },
          },
        });
        const target = await tx.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: change.teamId,
              userId: change.counterpartyUserId!,
            },
          },
        });
        if (!initiator || initiator.role !== "OWNER") {
          throw new BadRequestException(
            "Offering owner is no longer a team owner",
          );
        }
        if (!target) {
          throw new BadRequestException(
            "Offered member is no longer on the team",
          );
        }

        await tx.teamMember.update({
          where: { id: target.id },
          data: { role: "OWNER" },
        });
        await tx.teamMember.update({
          where: { id: initiator.id },
          data: { role: "ADMIN" },
        });
      } else if (change.type === "CO_OWNER") {
        const target = await tx.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: change.teamId,
              userId: change.counterpartyUserId!,
            },
          },
        });
        if (!target) {
          throw new BadRequestException(
            "Offered member is no longer on the team",
          );
        }
        await tx.teamMember.update({
          where: { id: target.id },
          data: { role: "OWNER" },
        });
      } else {
        // REQUEST → promote initiator to OWNER (existing owners stay)
        const requester = await tx.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: change.teamId,
              userId: change.initiatorUserId,
            },
          },
        });
        if (!requester) {
          throw new BadRequestException("Requester is no longer on the team");
        }
        await tx.teamMember.update({
          where: { id: requester.id },
          data: { role: "OWNER" },
        });
      }

      return tx.teamOwnershipChange.update({
        where: { id: change.id },
        data: {
          status: "ACCEPTED",
          responderUserId: userId,
          resolvedAt: new Date(),
        },
        include: {
          team: { select: { name: true } },
          initiator: { select: userSelect },
          counterparty: { select: userSelect },
          responder: { select: userSelect },
        },
      });
    });

    await this.auditService.record({
      organizationId: team.workspace.organizationId,
      workspaceId: team.workspaceId,
      actorUserId: userId,
      action: AuditAction.OWNERSHIP_ACCEPTED,
      entityType: "TeamOwnershipChange",
      entityId: change.id,
      summary: `Accepted ${change.type} ownership on "${team.name}"`,
      metadata: { type: change.type, teamId: team.id },
    });

    return this.mapOwnershipChange(updated);
  }

  async cancelOwnershipChange(userId: string, changeId: string) {
    const change = await this.prisma.teamOwnershipChange.findUnique({
      where: { id: changeId },
      include: {
        team: { select: { name: true } },
        initiator: { select: userSelect },
        counterparty: { select: userSelect },
        responder: { select: userSelect },
      },
    });
    if (!change) throw new NotFoundException("Ownership change not found");
    if (change.status !== "PENDING") {
      throw new BadRequestException("Only pending changes can be cancelled");
    }
    if (change.initiatorUserId !== userId) {
      throw new ForbiddenException("Only the initiator can cancel");
    }

    const team = await this.getTeamOrThrow(change.teamId);

    const cancelled = await this.prisma.teamOwnershipChange.update({
      where: { id: change.id },
      data: { status: "CANCELLED", resolvedAt: new Date() },
      include: {
        team: { select: { name: true } },
        initiator: { select: userSelect },
        counterparty: { select: userSelect },
        responder: { select: userSelect },
      },
    });
    await this.auditService.record({
      organizationId: team.workspace.organizationId,
      workspaceId: team.workspaceId,
      actorUserId: userId,
      action: AuditAction.OWNERSHIP_CANCELLED,
      entityType: "TeamOwnershipChange",
      entityId: change.id,
      summary: `Cancelled ${change.type} ownership on "${team.name}"`,
      metadata: { type: change.type, teamId: team.id },
    });
    return this.mapOwnershipChange(cancelled);
  }

  private async cancelPendingOffers(
    teamId: string,
    initiatorUserId: string,
    counterpartyUserId: string,
  ) {
    await this.prisma.teamOwnershipChange.updateMany({
      where: {
        teamId,
        initiatorUserId,
        counterpartyUserId,
        status: "PENDING",
        type: { in: ["TRANSFER", "CO_OWNER"] },
      },
      data: { status: "CANCELLED", resolvedAt: new Date() },
    });
  }

  private async expirePendingForTeam(teamId: string) {
    await this.prisma.teamOwnershipChange.updateMany({
      where: {
        teamId,
        status: "PENDING",
        expiresAt: { lte: new Date() },
      },
      data: { status: "CANCELLED", resolvedAt: new Date() },
    });
  }

  private async expirePendingForUser(userId: string) {
    await this.prisma.teamOwnershipChange.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lte: new Date() },
        OR: [
          { counterpartyUserId: userId },
          { initiatorUserId: userId },
        ],
      },
      data: { status: "CANCELLED", resolvedAt: new Date() },
    });
  }

  private mapOwnershipChange(row: {
    id: string;
    teamId: string;
    type: string;
    status: string;
    message: string | null;
    expiresAt: Date;
    resolvedAt: Date | null;
    createdAt: Date;
    team: { name: string };
    initiator: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
    counterparty: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    } | null;
    responder: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    } | null;
  }) {
    return {
      id: row.id,
      teamId: row.teamId,
      teamName: row.team.name,
      type: row.type as TeamOwnershipChangeType,
      status: row.status as TeamOwnershipChangeStatus,
      initiator: row.initiator,
      counterparty: row.counterparty,
      responder: row.responder,
      message: row.message,
      expiresAt: row.expiresAt,
      resolvedAt: row.resolvedAt,
      createdAt: row.createdAt,
    };
  }
}
