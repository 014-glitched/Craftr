# Craftr

Engineering collaboration platform — monorepo (`apps/web`, `apps/api`).

## Audit logs (early MVP)

Append-only tenancy / team action logs, viewable by **workspace OWNERs** at `/app/[orgSlug]/audit`.

See [`documents/12-audit-logs.md`](./documents/12-audit-logs.md). Full analytics remain Phase 13.

## Phase 3 status

Teams & Members:

- Workspace-scoped teams with `MemberRole` on `TeamMember`
- Teams page: `/app/[orgSlug]/teams` (teams belong to a workspace; pick via selector)
- Only org **OWNER** can create teams (modal); add/remove workspace members with confirm dialog
- Multiple owners via approval: transfer, co-owner offer, or ownership request (7-day expiry)
- Sole team owner cannot leave / be removed from org until ownership is transferred
- Sidebar: **Manage teams** link only (team picker is on the page as tabs)

See [`documents/11-teams-members.md`](./documents/11-teams-members.md).

## Phase 2 status

Organizations & Workspaces (multi-tenant core):

- Create org after signup (`/app/onboarding`) — **no** auto-created default workspace
- Login lands on `/app` org home; workspaces are optional
- Workspaces hub: `/app/[orgSlug]/workspaces` (education + create when empty)
- Workspace URLs: `/app/[orgSlug]/[workspaceSlug]`
- Org settings + invite links: `/app/[orgSlug]/settings`, `/invite/[token]`
- Apollo Client + membership guards on the API

See [`documents/10-organizations-workspaces.md`](./documents/10-organizations-workspaces.md).

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
- App home: http://localhost:3000/app  
- Onboarding: http://localhost:3000/app/onboarding  
- Workspaces hub: http://localhost:3000/app/{orgSlug}/workspaces  
- Workspace: http://localhost:3000/app/{orgSlug}/{workspaceSlug}  
- Teams: http://localhost:3000/app/{orgSlug}/teams  
- Audit: http://localhost:3000/app/{orgSlug}/audit  
- Org settings: http://localhost:3000/app/{orgSlug}/settings  
- GraphQL: http://localhost:4000/graphql  
- Auth API: http://localhost:4000/api/auth/*  

## Documentation

See [`documents/08-documentation-index.md`](./documents/08-documentation-index.md).
