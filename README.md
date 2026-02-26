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

## Notes

- Do not commit secrets (`.env`, API keys, credentials)
- Keep changes small and reviewable
- Prefer vertical slices over large rewrites

