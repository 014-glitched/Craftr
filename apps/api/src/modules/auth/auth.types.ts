import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthSession = {
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
  };
  user: AuthUser;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | null => {
    const ctx = GqlExecutionContext.create(context);
    const gqlCtx = ctx.getContext<{ user?: AuthUser }>();
    return gqlCtx.user ?? null;
  },
);
