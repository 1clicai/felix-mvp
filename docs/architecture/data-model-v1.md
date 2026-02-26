# V1 Data Model Overview

| Entity | Relationships | Purpose |
| --- | --- | --- |
| `Tenant` | 1→many `User`, `TokenAccount`, `Project`, `Connector`, `PromptRequest`, `ModuleExecution`, `Customer`, `Order`, `ChangeJob` | Root account/workspace, carries billing tier + isolation boundary. |
| `User` | Belongs to `Tenant`; authors `PromptRequest` records | Distinguish client admins/operators vs founder/system roles. |
| `TokenAccount` | Belongs to `Tenant`; 1→many `TokenTransaction` | Token ledger per plan tier; enforces balances + alerts. |
| `TokenTransaction` | Belongs to `TokenAccount` | Immutable log of credits/debits with metadata for reconciliation. |
| `Project` | Belongs to `Tenant`; 1→many `Connector`, `PromptRequest`, `ChangeJob` | Represents a codebase/app surface tied to repos + deployments. |
| `Connector` | Belongs to `Tenant`, optional `Project` | Stores third-party integration config/status (Shopify, GitHub, etc.). |
| `PromptRequest` | Belongs to `Tenant`, optional `Project` + `User`; 1→many `DeploymentPlan`, `ChangeJob` | Captures natural-language change requests and lifecycle state. |
| `DeploymentPlan` | Belongs to `PromptRequest`; 1→many `Deployment` | Holds risk, token estimate, diff summary, approval status. |
| `Deployment` | Belongs to `DeploymentPlan`; optional self-reference for rollbacks | Tracks each staging/prod promotion with links to diffs/logs. |
| `ChangeJob` | Belongs to `Tenant`, optional `Project`/`PromptRequest`/`DeploymentPlan` | Represents queued work unit (AI change, validation, deploy). |
| `ModuleExecution` | Belongs to `Tenant` | Records execution metadata for module actions (Order Sync, reports, etc.). |
| `Customer` | Belongs to `Tenant`; 1→many `Order` | CRM-lite profile for dashboards. |
| `Order` | Belongs to `Tenant`, optional `Customer` | Unified commerce records across channels/sources. |

Enums record states for prompts, deployments, connectors, modules, orders, and token directions. See `prisma/schema.prisma` for canonical definitions.
