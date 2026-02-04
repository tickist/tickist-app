# Repository Guidelines

## Project Structure & Module Organization

Work inside `apps/tickist-web/`. Angular sources live in `apps/tickist-web/src/app` (features: auth, app-shell, dashboard, tags, task-fab, etc.; shared helpers under `core`; data access in `data` with Supabase services/guards/toasts). Supabase migrations and edge functions live in root `supabase/` (`migrations/`, `functions/` restored from backup). Legacy directories have been removed; only the current app is maintained.

## Build, Test, and Development Commands

- `npm run start` (or `npx nx serve tickist-web`) – dev server on 4200; auto-loads `.local_env` so NG*APP*\* and DB URLs are set.
- `npm run build` / `npx nx build tickist-web` – Vite build to `dist/tickist-web`.
- `npm run test` / `npx nx test tickist-web` – Vitest via `@analogjs/vitest-angular`.
- `npx nx e2e tickist-web` – Playwright UI flows (auth, dashboard, tasks).
- Supabase: `db:push:*`, `db:pull:*`, `db:types:*`, `db:reset:*`, plus `supabase:start|stop|status`; always target `.local_env` (local) or `.env` (remote) to avoid WSL collisions.

## Coding Style & Naming Conventions

Angular 20 standalone only—no NgModules. Prefer signals first; bridge to RxJS when streams are required. Use 2-space indent, PascalCase for components/services, camelCase for variables, snake_case for DB columns. Styling is Tailwind + DaisyUI; favor utility classes and `@apply` for reuse. Keep the Tickist dark palette; add light themes via `tailwind.config.ts` when approved. Forms and modals should stay keyboard-accessible and responsive down to mobile.

## Testing Guidelines

Cover services/guards/components with Vitest; stub Supabase via the official client helpers, not ad-hoc mocks. Avoid fake UI data—seed through `supabase/seed.sql` or fixtures. Playwright should exercise critical journeys (sign-up/sign-in/reset, project/task CRUD, tag filters, dashboard). Add regression tests when changing routing, auth, or data contracts.

## Commit & Pull Request Guidelines

Branch from `develop` using `rewrite/<feature>` or `supabase/<area>`. Commits are imperative and scoped (`feat(tasks): color-code priority`) and should note schema or ENV impacts. PRs must mention updated sections of `MIGRATION_PLAN.md`, list touched Nx targets, and include screenshots/terminal output for UI or CLI changes. Run `nx format` + `nx lint` + `nx test` + `nx build` (or `nx affected …`) before review.

## Configuration & Supabase

Copy `.env.example` to `.env` (remote) and `.local_env` (local). Required keys: `NG_APP_SUPABASE_URL`, `NG_APP_SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`, `SUPABASE_REMOTE_DB_URL`. Deploy edge functions with `npx supabase functions deploy <name>`. Never commit secrets. Update this guide when workflows or environments change.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.

<!-- nx configuration end-->
