# Repository Guidelines

## Project Structure & Module Organization

Work inside `apps/tickist-web/`. Angular sources live in `apps/tickist-web/src/app` (features: auth, app-shell, dashboard, tags, task-fab, etc.; shared helpers under `core`; data access in `data` with Supabase services/guards/toasts). Supabase migrations and edge functions live in root `supabase/` (`migrations/`, `functions/` restored from backup). Legacy directories have been removed; only the current app is maintained.

## Build, Test, and Development Commands

- `npm run start` (or `npx nx serve tickist-web`) – dev server on 4200; auto-loads `.local_env` so NG*APP*\* and DB URLs are set.
- `npm run build` / `npx nx build tickist-web` – Vite build to `dist/tickist-web`.
- `npm run test` / `npx nx test tickist-web` – Vitest via `@analogjs/vitest-angular`.
- `npx nx e2e tickist-web-e2e` – Playwright UI flows (auth, dashboard, tasks). Use `.local_env.e2e` or `.env.e2e` with dedicated `SUPABASE_E2E_DB_URL`.
- Supabase: `db:push:*`, `db:pull:*`, `db:types:*`, `db:reset:*`, plus `supabase:start|stop|status`; always target `.local_env` (local) or `.env` (remote) to avoid WSL collisions.

## Coding Style & Naming Conventions

Angular 20 standalone only—no NgModules. Prefer signals first; bridge to RxJS when streams are required. Use 2-space indent, PascalCase for components/services, camelCase for variables, snake_case for DB columns. Styling is Tailwind + DaisyUI; favor utility classes and `@apply` for reuse. Keep the Tickist dark palette; add light themes via `tailwind.config.ts` when approved. Forms and modals should stay keyboard-accessible and responsive down to mobile.

### Lint Guardrails (must follow)

- In Angular templates use built-in control flow only: `@if`, `@for`, `@switch`. Do not introduce `*ngIf`, `*ngFor`, or `*ngSwitch`.
- Do not add `(click)` handlers to non-interactive elements unless they are keyboard-accessible too (`tabindex="0"` + Enter/Space handlers). Prefer semantic interactive elements (`button`) when possible.
- Avoid `any` and non-null assertions (`!`) in TypeScript. Use explicit interfaces/types and guard values before use.
- Remove unused imports/symbols immediately; keep `nx lint tickist-web` clean before finishing work.

## Testing Guidelines

Cover services/guards/components with Vitest; stub Supabase via the official client helpers, not ad-hoc mocks. Avoid fake UI data—seed through `supabase/seed.sql` or fixtures. Playwright should exercise critical journeys (sign-up/sign-in/reset, project/task CRUD, tag filters, dashboard). Add regression tests when changing routing, auth, or data contracts.

## Commit & Pull Request Guidelines

Branch from `develop` using `rewrite/<feature>` or `supabase/<area>`. Commits are imperative and scoped (`feat(tasks): color-code priority`) and should note schema or ENV impacts. PRs must mention updated sections of `MIGRATION_PLAN.md`, list touched Nx targets, and include screenshots/terminal output for UI or CLI changes. Run `nx format` + `nx lint` + `nx test` + `nx build` (or `nx affected …`) before review.

## Configuration & Supabase

Copy `.env.example` to `.env` (remote) and `.local_env` (local). For E2E, use a separate `.local_env.e2e` or `.env.e2e` file. Required keys: `NG_APP_SUPABASE_URL`, `NG_APP_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_URL`, `SUPABASE_E2E_DB_URL`, `SUPABASE_REMOTE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY` (for Day-0 migration importer), `ROUTINE_RUNNER_SECRET` (internal header secret for `routine-runner`). E2E DB URL must point to a dedicated test database/branch and must not reuse local dev or remote shared DB URLs. All database changes must be backward compatible because the application is already running in production; avoid single-step breaking schema changes and prefer additive, phased migrations. Deploy edge functions with `npx supabase functions deploy <name>`. Never commit secrets. Update this guide when workflows or environments change.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
