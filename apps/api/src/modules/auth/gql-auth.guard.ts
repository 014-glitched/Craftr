import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import type { AuthUser } from "./auth.types";

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const gqlCtx = ctx.getContext<{
      req: Request;
      user?: AuthUser;
    }>();

    const headers = new Headers();
    const cookie = gqlCtx.req.headers.cookie;
    if (cookie) {
      headers.set("cookie", cookie);
    }
    const authorization = gqlCtx.req.headers.authorization;
    if (authorization) {
      headers.set("authorization", authorization);
    }

    const session = await this.authService.getSessionFromHeaders(headers);
    if (!session?.user) {
      throw new UnauthorizedException("Authentication required");
    }

    gqlCtx.user = session.user as AuthUser;
    return true;
  }
}
