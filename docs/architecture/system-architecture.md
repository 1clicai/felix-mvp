# Felix PPS Platform — System Architecture Overview

## Guiding Principles

1. **Token-first economics** – every action that mutates state or consumes compute must reconcile with the token ledger.
2. **Prompt-to-change safety** – all AI-generated changes run through plan → diff → approval → deploy with automatic rollbacks.
3. **Multi-tenant isolation** – tenant-aware data models, auth, and storage boundaries by default.
4. **Composable modules** – app functionality ships as discrete services that plug into the shared dashboard shell.

## High-Level Components

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│                                 Client Layer                                  │
│                                                                               │
│  Dashboard (Next.js)                Founder Console (Next.js)                  │
│  - Token meter                      - Client onboarding                        │
│  - App surfaces                     - App builder controls                      │
│  - Analytics                        - Token/admin overrides                     │
└───────────────────────────────────────────────────────────────────────────────┘
              │                              │
              └───────────────┬──────────────┘
                              ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            Application Services                               │
│                                                                               │
│  API Gateway / BFF (apps/api)                                                 │
│  - Auth + session management                                                  │
│  - Tenant context propagation                                                 │
│                                                                               │
│  Token Ledger Service (packages/token-ledger)                                 │
│  - Stripe webhooks                                                            │
│  - Usage metering + alerts                                                    │
│                                                                               │
│  Prompt Execution Engine (packages/prompt-engine)                             │
│  - Context ingestion (repos, schemas, docs)                                   │
│  - Plan + diff generation, rollout guardrails                                 │
│                                                                               │
│  App Modules (packages/core + feature packages)                               │
│  - Order Sync, Report Generator, Email Automator, Inventory, CRM, etc.        │
└───────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                               Data & Infra Layer                              │
│                                                                               │
│  Postgres / Prisma (prisma/)                                                  │
│  - Tenants, clients, apps, prompts, deployments, token transactions           │
│                                                                               │
│  Object Storage                                                               │
│  - Prompt artifacts, report exports, media assets                             │
│                                                                               │
│  Event Bus / Queue                                                            │
│  - Token debit events, webhook retries, async jobs                            │
│                                                                               │
│  Observability                                                                │
│  - Structured logging, metrics, audit trails                                  │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Data Domains

| Domain | Entities | Notes |
| --- | --- | --- |
| Identity | Tenant, User, Role, Session | Multi-tenant auth boundaries, role-based access (client vs founder) |
| Catalog | AppTemplate, Module, DeploymentPlan | Ties prompt outputs to deployable artifacts |
| Ledger | TokenAccount, TokenTransaction, BalanceSnapshot | Must remain strongly consistent with Stripe events |
| Commerce | Order, Product, Customer, InventoryItem | Powers unified sales dashboard |
| Messaging | Conversation, Message, Channel | WhatsApp + future channels |

## Tech Stack Baseline

- **Framework**: Next.js 15 (app router) for dashboard + founder console
- **Language**: TypeScript end-to-end
- **API surface**: Next.js route handlers or dedicated Fastify/Express service (apps/api)
- **Database**: Postgres via Prisma
- **Queue**: In-memory stub → upgrade to Upstash/Redis/Kafka when needed
- **CI/CD**: GitHub Actions (lint, typecheck, test, deploy workflows)

## Security & Compliance Considerations

- Secrets managed via platform secret store (.env.example documents requirements; `.env` ignored)
- GitHub access tokens stored per tenant with least privilege scopes
- Stripe + WhatsApp webhooks validated with signature verification
- Audit log tables capture every admin + AI action for dispute resolution

## Next Steps

1. Finalize Prisma ERD covering domains above.
2. Define API contracts between apps/api and packages/* services.
3. Implement seed data + fixtures for synthetic tenants to unblock testing (Phase 4).
