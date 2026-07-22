# Craftr

Engineering collaboration platform — monorepo (`apps/web`, `apps/api`).

## Phase 1 status

Foundation + Authentication:

- pnpm + Turborepo monorepo
- NestJS GraphQL API with Better Auth
- Next.js auth UI (login / signup) + protected `/app` shell
- Prisma + Postgres via **Neon** (hosted; no Docker required)

## Prerequisites

- Node 20+
- pnpm 9 (`npm i -g pnpm@9`)
- A Postgres database — **Neon free tier recommended** (no Docker)

Docker Compose exists in the repo for later optional use, but it is **not required** right now.

## Quick start (Neon — recommended)

1. Create a free project at [neon.tech](https://neon.tech) and copy the connection string.
2. Put it in both:
   - `apps/api/.env` → `DATABASE_URL=...`
   - `packages/database/.env` → `DATABASE_URL=...`
3. Install and run:

```bash
pnpm install
pnpm db:push
pnpm db:generate
pnpm dev
```

- Landing: http://localhost:3000  
- Sign in: http://localhost:3000/login  
- Sign up: http://localhost:3000/signup  
- App shell: http://localhost:3000/app  
- GraphQL: http://localhost:4000/graphql  
- Auth API: http://localhost:4000/api/auth/*  

## Documentation

See [`documents/08-documentation-index.md`](./documents/08-documentation-index.md).
