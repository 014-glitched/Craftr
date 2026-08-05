import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  fromPrismaRole,
  MemberRole,
  toPrismaRole,
} from "../../common/tenancy/member-role.enum";
import { inviteEmailSchema } from "@craftr/validation";
import { parseInput } from "../../common/validation/parse-input";
import { maskEmail } from "../../common/tenancy/slug.util";
import { OrganizationsService } from "./organizations.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";

const INVITE_TTL_DAYS = 7;

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    userId: string,
    organizationId: string,
    email: string,
    role: MemberRole,
    workspaceId?: string,
  ) {
    await this.organizationsService.requireOrgRole(
      userId,
      organizationId,
      MemberRole.ADMIN,
    );

    const normalizedEmail = parseInput(inviteEmailSchema, email).toLowerCase();

    if (workspaceId) {
      const ws = await this.prisma.workspace.findFirst({
        where: { id: workspaceId, organizationId },
      });
      if (!ws) throw new NotFoundException("Workspace not found in organization");
      if (ws.archivedAt) {
        throw new BadRequestException("Cannot invite to an archived workspace");
      }
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

    const invitation = await this.prisma.invitation.create({
      data: {
        organizationId,
        workspaceId: workspaceId ?? null,
        email: normalizedEmail,
        role: toPrismaRole(role),
        token,
        expiresAt,
        invitedByUserId: userId,
      },
    });

    await this.auditService.record({
      organizationId,
      workspaceId: workspaceId ?? null,
      actorUserId: userId,
      action: AuditAction.INVITATION_CREATED,
      entityType: "Invitation",
      entityId: invitation.id,
      summary: `Created invitation for ${normalizedEmail}`,
      metadata: { email: normalizedEmail, role, workspaceId: workspaceId ?? null },
    });

    return invitation;
  }

  async preview(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        workspace: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!invitation) throw new NotFoundException("Invitation not found");
    if (invitation.acceptedAt) {
      throw new BadRequestException("Invitation already accepted");
    }
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException("Invitation expired");
    }

    return {
      organizationName: invitation.organization.name,
      organizationSlug: invitation.organization.slug,
      workspaceName: invitation.workspace?.name ?? null,
      emailMasked: maskEmail(invitation.email),
      email: invitation.email,
      role: fromPrismaRole(invitation.role),
      expiresAt: invitation.expiresAt,
    };
  }

  async accept(userId: string, userEmail: string, token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { organization: true, workspace: true },
    });

    if (!invitation) throw new NotFoundException("Invitation not found");
    if (invitation.acceptedAt) {
      throw new BadRequestException("Invitation already accepted");
    }
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException("Invitation expired");
    }

    const normalizedEmail = userEmail.trim().toLowerCase();
    if (normalizedEmail !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(
        "Sign in with the email address this invitation was sent to.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existingOrgMember = await tx.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId,
          },
        },
      });

      if (!existingOrgMember) {
        await tx.organizationMember.create({
          data: {
            organizationId: invitation.organizationId,
            userId,
            role: invitation.role,
          },
        });
      }

      const workspaceId = invitation.workspaceId;
      if (workspaceId) {
        const existingWsMember = await tx.workspaceMember.findUnique({
          where: {
            workspaceId_userId: { workspaceId, userId },
          },
        });
        if (!existingWsMember) {
          await tx.workspaceMember.create({
            data: {
              workspaceId,
              userId,
              role: invitation.role,
            },
          });
        }
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return {
        organization: invitation.organization,
        workspace: invitation.workspace,
      };
    });
  }
}
