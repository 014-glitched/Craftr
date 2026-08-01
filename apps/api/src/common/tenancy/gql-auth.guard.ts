import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { Request } from "express";
import { AuthService } from "../../modules/auth/auth.service";
import type { AuthUser } from "../../modules/auth/auth.types";
import type { GqlContext } from "./gql-context.types";

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const gqlCtx = ctx.getContext<GqlContext>();

    if (gqlCtx.user) return true;

    const headers = new Headers();
    const req = gqlCtx.req as unknown as Request;
    const cookie = req.headers.cookie;
    if (cookie) headers.set("cookie", cookie);
    const authorization = req.headers.authorization;
    if (authorization) headers.set("authorization", authorization);

    const session = await this.authService.getSessionFromHeaders(headers);
    if (!session?.user) {
      throw new UnauthorizedException("Authentication required");
    }

    gqlCtx.user = session.user as AuthUser;
    return true;
  }
}

export function getGqlContext(context: ExecutionContext): GqlContext {
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext<GqlContext>();
}

export function requireUser(gqlCtx: GqlContext): AuthUser {
  if (!gqlCtx.user) {
    throw new UnauthorizedException("Authentication required");
  }
  return gqlCtx.user;
}

export function requireOrgMembership(gqlCtx: GqlContext) {
  if (!gqlCtx.orgMembership) {
    throw new ForbiddenException("Organization membership required");
  }
  return gqlCtx.orgMembership;
}

export function requireWorkspaceMembership(gqlCtx: GqlContext) {
  if (!gqlCtx.workspaceMembership) {
    throw new ForbiddenException("Workspace membership required");
  }
  return gqlCtx.workspaceMembership;
}
