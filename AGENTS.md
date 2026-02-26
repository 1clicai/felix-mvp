## AI Agents in This Workspace

This `AGENTS.md` file documents how AI agents are intended to be used in this workspace when working in Cursor (or any similar AI-assisted IDE).

- **Primary agent**: The main coding assistant that collaborates with you in Cursor. It:
  - Helps design and implement features
  - Refactors and documents code
  - Writes and runs tests (when requested)
  - Explains code, errors, and architecture

- **Subagents / tools**: Specialized helpers that may be invoked behind the scenes:
  - **Shell / CLI**: Runs commands such as `npm test`, `pytest`, `git status`, etc.
  - **Searcher**: Uses project-wide search to find symbols, references, and examples.
  - **Linter / diagnostics**: Surfaces compiler and linter errors and suggests fixes.
  - **Browser / web search (if enabled)**: Looks up external docs, APIs, and examples.

## How to Work with Agents

- **Be explicit about intent**: Say what you want (e.g. “implement X”, “refactor Y”, “explain Z”).
- **Point to files / symbols**: Use references like `src/app.ts`, `UserService`, or `getUser()` when possible.
- **Request scope clearly**:
  - “Only change this file”
  - “Update all call sites”
  - “Just give me an explanation, don’t edit code”
- **Ask for tests**: When adding or changing behavior, request tests or a test plan.

## Conventions for This Project

- **Coding style**:
  - Follow existing patterns and libraries in the codebase.
  - Prefer small, focused functions and clear naming.
  - Avoid adding comments that simply restate what the code already makes obvious.
- **Safety**:
  - Never add secrets (API keys, passwords) to the repo.
  - Do not introduce destructive commands (e.g. `rm -rf`, force pushes) unless explicitly requested.

## Updating This Document

Keep this file up to date as your workflow evolves. When you adopt new tools, add new subagents, or define project-specific rules (testing strategy, branching model, deployment flow), document them here so both humans and AI agents can follow the same conventions.
