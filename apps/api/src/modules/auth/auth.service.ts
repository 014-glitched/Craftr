import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaService } from "../../common/prisma/prisma.service";

function createAuth(options: {
  prisma: PrismaService;
  baseURL: string;
  webOrigin: string;
  secret: string;
}) {
  return betterAuth({
    baseURL: options.baseURL,
    basePath: "/api/auth",
    secret: options.secret,
    database: prismaAdapter(options.prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    trustedOrigins: [options.webOrigin, options.baseURL],
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
  });
}

@Injectable()
export class AuthService {
  readonly auth: ReturnType<typeof createAuth>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.auth = createAuth({
      prisma: this.prisma,
      baseURL:
        this.config.get<string>("BETTER_AUTH_URL") ?? "http://localhost:4000",
      webOrigin:
        this.config.get<string>("WEB_ORIGIN") ?? "http://localhost:3000",
      secret: this.config.getOrThrow<string>("BETTER_AUTH_SECRET"),
    });
  }

  async getSessionFromHeaders(headers: Headers) {
    return this.auth.api.getSession({ headers });
  }
}
