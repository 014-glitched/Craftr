import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import type { NestExpressApplication } from "@nestjs/platform-express";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { AppModule } from "./app.module";
import { AuthService } from "./modules/auth/auth.service";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  const config = app.get(ConfigService);
  const webOrigin = config.get<string>("WEB_ORIGIN") ?? "http://localhost:3000";
  const port = Number(config.get<string>("PORT") ?? 4000);

  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  });

  const expressApp = app.getHttpAdapter().getInstance();
  const authService = app.get(AuthService);
  const authHandler = toNodeHandler(authService.auth);

  // Express 5-safe mount for Better Auth (avoids /*path 404 issues)
  expressApp.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api/auth")) {
      return authHandler(req, res);
    }
    return next();
  });

  expressApp.use(express.json({ limit: "2mb" }));
  expressApp.use(express.urlencoded({ extended: true }));

  await app.listen(port);
  console.log(`Craftr API listening on http://localhost:${port}`);
  console.log(`GraphQL playground http://localhost:${port}/graphql`);
  console.log(`Auth endpoints http://localhost:${port}/api/auth/*`);
}

bootstrap();
