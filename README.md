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
3. **Start local stack** (API + Postgres + Redis + worker)
   ```bash
   docker compose up -d postgres redis
   npm run prisma:migrate -- --name init # first run only
   npm run prisma:generate
   npm run dev:api
   npm run dev:worker # new BullMQ worker (separate terminal)
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

See `docs/api/projects.md`, `docs/api/prompts.md`, `docs/api/change-jobs.md`, and `docs/api/connectors.md` for curl-ready examples.

### Prompt & Job Flow (MVP)
- `POST /auth/token` → obtain tenant-scoped JWT
- `POST /api/prompts` → persists prompt + enqueues `changeJob`
- `GET /api/projects/:projectId/prompts` / `:promptId` → inspect requests + linked jobs
- `GET /api/projects/:projectId/change-jobs` → monitor queue
- BullMQ worker (Redis-backed) processes queued jobs asynchronously; run `npm run dev:worker` alongside the API.
- Worker now calls the configured LLM provider (OpenAI by default) to generate structured plans. Jobs store provider metadata + summaries.
- If `OPENAI_API_KEY` is missing, jobs fail with `EXECUTION_PROVIDER_UNAVAILABLE` (documented fallback below).
- `POST /api/change-jobs/:id/transition` still available for manual overrides during testing.
- ⚠️ LLM output is **read-only planning**. No repositories/code are modified yet.

### GitHub Connector Flow (MVP)
1. `POST /api/projects/:projectId/connectors` (body: provider `github`, auth `pat`, repo owner/name, token)
2. `POST /api/projects/:projectId/connectors/:id/validate` → checks PAT + repo access, updates status
3. `GET /api/projects/:projectId/connectors` → inspect status / last validation info

> ⚠️ Connector PATs are encrypted at rest using AES-256-GCM with a key sourced from `CONNECTOR_SECRET_ENCRYPTION_KEY`. Store the key securely (KMS/Vault recommended for prod). Legacy plaintext values are auto-re-encrypted on first read.

### Frontend (Dashboard) Workflow
1. `npm run dev:api` (backend), `npm run dev:worker` (LLM worker), and `npm run dev:dashboard` (frontend) with `.env` containing `NEXT_PUBLIC_API_BASE_URL`.
2. Visit `http://localhost:3000`, paste a bearer token (from `POST /auth/token`).
3. Pick a project → tabs for **Connectors**, **Prompts**, **Jobs**.
   - Register & validate GitHub connector directly in UI.
   - Submit prompts (optional connector linkage) and watch jobs appear.
   - Job list auto-polls; statuses update as the worker runs.
4. Manual test checklist lives in `docs/api/*.md` curl samples.

### LLM Execution Setup
- Required vars: `OPENAI_API_KEY` and optional `OPENAI_MODEL` (defaults to `gpt-4.1-mini`).
- Worker generates structured plans only (intent, proposed changes, risks, next steps). No code changes are made yet.
- If no API key is configured, the worker leaves jobs in `FAILED` with `EXECUTION_PROVIDER_UNAVAILABLE`. Frontend + APIs continue to work, but results will be empty.
- Future providers can plug into `PromptExecutionProvider`; OpenAI is the first adapter.

### Connector Secret Encryption
- Set `CONNECTOR_SECRET_ENCRYPTION_KEY` to a base64-encoded 32-byte key (e.g. `openssl rand -base64 32`).
- The API fails fast at startup if the key is missing or invalid.
- PATs are encrypted before persistence; ciphertext, IV, tag, and key version are stored alongside metadata.
- Legacy plaintext secrets are re-encrypted automatically the next time they are accessed.
- Production recommendation: store the encryption key in a managed KMS/HSM/Vault and rotate via `credentialKeyVersion`.

## Notes

- Do not commit secrets (`.env`, API keys, credentials)
- Keep changes small and reviewable
- Prefer vertical slices over large rewrites


### Repository Ingestion (MVP)
- Trigger via POST /api/projects/:projectId/connectors/:id/ingestion-runs (see docs/api/ingestion.md).
- BullMQ worker shares the same process (npm run dev:worker) and fetches repo metadata + file tree snapshots.
- Indexed context is stored in ProjectContextDocument for future prompt usage.
