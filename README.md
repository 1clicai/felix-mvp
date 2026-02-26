<<<<<<< HEAD
# Felix MVP (PPS)
=======
Felix MVP (PPS)
>>>>>>> 2957399c11bcbe008d5f812e151488debd622128

This repository is the starting point for building a **Prompting Personalized Software (PPS)** platform.

PPS is a platform that helps business users improve or build software products by prompting in natural language. The system connects to product context (codebase, APIs, data, docs) and helps generate safe, reviewable changes across frontend, backend, and deployment workflows.

## Project Goal

Build an MVP that allows:

- business users to describe software changes in plain language
- the platform to generate a scoped implementation plan
- safe review/approval of proposed changes
- versioned execution and deployment to staging/production

## Current Context

- Business blueprint source: `business blueprint v6.md`
- Agent persona: `Felix` (Technical Lead + Full-Stack Builder)
- Development approach: phased delivery (`Spec -> Architecture -> Build -> Test -> Deploy`)

## Architecture Snapshot (2026-02-26)

- System overview and guardrails live in `docs/architecture/system-architecture.md`
- Phase 4 hardening/test plan defined in `docs/architecture/phase4-test-plan.md`
- Prisma domain modeling starts in `prisma/schema.prisma`
- Monorepo layout driven by workspaces (`apps/*`, `packages/*`)

## Recommended MVP Direction

Initial focus for v1:

- Context connectors (repo/docs/schema ingestion)
- Prompt-to-change workflow (plan + proposal)
- Safe execution pipeline (tests, approvals, deploy checklist)

## Repository Usage (OpenClaw / Agent)

Use this repo as the working project for OpenClaw.

Suggested first tasks:

1. Read `business blueprint v6.md`
2. Define MVP scope and acceptance criteria
3. Propose architecture and project structure
4. Scaffold the initial codebase

## Backend Setup (Phase 3 foundation)

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   ```bash
   cp .env.example .env
   # update secrets + connection strings as needed
   ```
3. **Start local stack** (API + Postgres + Redis)
   ```bash
   docker compose up -d postgres redis
   npm run prisma:migrate -- --name init # first run only
   npm run prisma:generate
   npm run dev:api
   ```
   Or run everything in containers:
   ```bash
   docker compose up api
   ```
4. **Dashboards** (optional for now)
   ```bash
   npm run dev:dashboard
   npm run dev:founder
   ```

## Auth Strategy (Phase 3)

- **What**: Signed JWTs (12h TTL) issued via `POST /auth/token` using tenant slug + user email.
- **Why**: Keeps MVP fast—no external IdP yet, but still enforces tenant membership and revocation via database lookups per request.
- **Tradeoffs**: Tokens rely on shared secret and manual user provisioning. Future iterations can swap in Clerk/Auth0 without touching route guards (replace token issuer + verifier).

See `docs/api/projects.md` and `docs/api/prompts-change-jobs.md` for curl-ready examples.

### Prompt & Job Flow (MVP)
- `POST /auth/token` → obtain tenant-scoped JWT
- `POST /api/prompts` → persists prompt + enqueues `changeJob`
- `GET /api/projects/:projectId/change-jobs` → monitor queue
- `POST /api/change-jobs/:id/transition` → simulate worker status updates until real workers attach.

## Notes

- Do not commit secrets (`.env`, API keys, credentials)
- Keep changes small and reviewable
- Prefer vertical slices over large rewrites

