# Phase 4 Test & Hardening Plan

Phase 4 validates that the Felix PPS platform is safe to operate end-to-end before onboarding paid clients. Tests cover four pillars: token economics, app modules, prompt workflow, and security/observability.

## 1. Token Economy Validation

### Objectives
- Ensure every mutating action reconciles with the token ledger.
- Confirm rollover, alerts, and top-ups match blueprint commitments.

### Test Matrix
| Scenario | Steps | Expected Result |
| --- | --- | --- |
| Subscription purchase | Simulate Stripe checkout → webhook | TokenAccount credited, BalanceSnapshot created |
| One-time pack purchase | Trigger Stripe one-time event | Tokens added, audit log entry stores pricing plan |
| Token consumption | Invoke module action (e.g., Report Generator) | Debit with metadata: `tenantId`, `module`, `action`, `cost` |
| Low-balance alert | Drain account to 20% | Notification event enqueued (email + SMS) |
| Token exhaustion | Execute action with insufficient balance | Action denied, ledger remains unchanged |
| Rollover window | Advance clock to 90/365-day limits | Expired tokens removed, ledger note added |

### Tooling
- Unit tests in `packages/token-ledger`
- Integration tests via `apps/api` mock routes
- Stripe CLI webhook replay fixtures

## 2. App Module QA

### Modules in Scope
1. Order Sync App
2. Report Generator
3. Email Automator
4. Inventory Manager (baseline CRUD)

### Test Coverage
- **Connectivity**: Each module must gracefully handle upstream outages (Shopify mock, SMTP mock, etc.).
- **Idempotency**: Re-running the same sync/report/email should not double-charge tokens or duplicate records.
- **Telemetry**: Modules emit structured events (`module`, `action`, `duration`, `tokenCost`).

### Acceptance
- For every module, run golden-path manual test + automated regression covering success, validation error, upstream error.

## 3. Prompt Workflow Verification

| Stage | Validation |
| --- | --- |
| Context ingestion | Repo/doc/schema snapshot hashed + cached with TTL |
| Plan generation | Deterministic fixtures ensure prompt outputs contain scope, impact, risk, token estimate |
| Diff review | Plain-language diff renders before deploy; includes rollback reference |
| Approval gate | Requires positive token balance + user confirmation |
| Deploy | Runs in staging first, surfaces preview URL, then promotes to prod |
| Rollback | Restores previous deployment + tokens refunded or annotated |

Automation: add contract tests around `packages/prompt-engine` to ensure JSON outputs follow schema.

## 4. Security, Isolation, Observability

- **Multi-tenant auth**: JWT/session tests verifying no cross-tenant resource access.
- **GitHub scopes**: Integration test ensures tokens limited to repo actions specified by tenant.
- **Webhook robustness**: Replay invalid signatures, ensure 401 + no processing.
- **Audit trails**: Every admin + AI action stored with actor, timestamp, payload hash.
- **Monitoring**: Smoke tests confirm metrics/log pipelines capture token debits, prompt deploys, WhatsApp sends.

## Exit Criteria
1. All tests above automated in CI (GitHub Actions) with >90% critical-path coverage.
2. Synthetic tenant suite completing prompt → plan → deploy → rollback without manual intervention.
3. Token ledger reconciled against Stripe fixtures for three sample clients with <0.1% variance.
4. Pen-test checklist (authz, secrets, webhooks) signed off.
5. Runbook drafted for incident response (token mismatch, failed deploy, WhatsApp outage).

## Deliverables
- Test harness + fixtures committed under `tests/phase4/` (future work).
- CI workflow `ci-phase4.yml` enforcing lint, typecheck, unit/integration suites.
- Dashboard in observability stack to monitor Phase 4 KPIs (token accuracy, prompt success rate, module uptime).
