# Tickist

[![CI](https://github.com/tickist/tickist-app/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/tickist/tickist-app/actions/workflows/ci.yml)

Tickist is a task and project workspace for keeping everyday work clear: collect tasks in an Inbox, organize them into projects, plan deadlines and reminders, and see what actually changed. The application is an Angular frontend backed by Supabase and deployed as a Cloudflare Worker.

> **Status:** `tickist-web` is the active application in this Nx workspace. Development happens on `develop`; production deployments are triggered from `master`.

## Highlights

- **Inbox and projects** — including hierarchical projects, shared access, project settings, a searchable 151-icon Lucide branding catalogue, and extended or compact task views.
- **Task management** — priorities, due dates, completion dates, timed or indefinite suspension, descriptions, subtasks, tags, time estimates, pinned tasks, task types, and recurring rules.
- **Find the right work** — project, tag, search, date, and completion filters; sorting by priority, due date, creation date, modification date, or name.
- **Stay on top of work** — dashboard, task tree, project activity, reminders, and statistics.
- **Notifications** — in-app notifications and email delivery through a transactional outbox, Supabase Edge Functions, and AWS SES.
- **Portable data** — import/export support with stable identifiers for safe migration between installations.
- **MCP integrations** — OAuth 2.1 and scoped personal-token access to project, task, and tag tools over MCP `2026-07-28`, with `2025-06-18` compatibility.
- **Public multilingual blog** — lightweight, repository-authored English and Polish blog indexes with independent editorial catalogues, taxonomy support, and crawl-ready metadata.

## Architecture

```text
Angular 22 browser app
        │
        ├── Supabase Auth, Postgres, Storage and Realtime
        │       └── Row Level Security enforces project and task access
        │
        └── Supabase Edge Functions ──> AWS SES email delivery

The `tickist-app` Cloudflare Worker serves the production SPA and runtime configuration. A separate `tickist-mcp` Worker serves `https://mcp.tickist.com/mcp`; `https://tickist.com/mcp` remains a temporary compatibility proxy.
```

| Area                  | Technology                                                  |
| --------------------- | ----------------------------------------------------------- |
| Frontend              | Angular 22, standalone components, signals, Vite            |
| Workspace and testing | Nx 23, Vitest, Playwright                                   |
| UI                    | Tailwind CSS, DaisyUI, Lucide                               |
| Backend               | Supabase: Postgres, Auth, Storage, Realtime, Edge Functions |
| Delivery              | Cloudflare Worker, GitHub Actions, AWS SES                  |

## Repository map

```text
apps/
  tickist-web/          Angular application and SPA Cloudflare Worker
  mcp/                  Dedicated HTTP and STDIO MCP server
  tickist-web-e2e/      Playwright journeys and database-reset safety checks
libs/data-access/
  tickist/              User-token Supabase access for MCP
supabase/
  migrations/           Ordered, backward-compatible database migrations
  functions/            Edge Functions for reminders, sharing, and email
docs/                   Operational documentation
tools/scripts/          Local Supabase and type-generation helpers
```

The UI source lives in `apps/tickist-web/src/app/`. Its main areas are `auth`, `app-shell`, `blog`, `dashboard`, `tags`, `task-fab`, `team`, `core`, and `data`.

## Public blog

The public blog is available at `/en/blog` and `/pl/blog`. Both language editions have independent repository-owned Markdown, category, and tag catalogues; they are not automatic translations of one another. The first release intentionally has no comments, CMS, or administration panel.

Add articles under `apps/tickist-web/content/blog/{en|pl}/`, then run `npm run blog:generate` and `npm run blog:check`. Drafts remain outside public output until `draft: false`. Follow [the blog content guide](doc/blog.md) for the front matter, locale boundary, taxonomy, article images, canonical metadata, RSS, and sitemap requirements.

## Prerequisites

- Node.js **24** (at least 24.15)
- npm
- Docker Desktop or Docker Engine (required by Supabase CLI)
- Supabase CLI — invoked through `npx`, so a global installation is optional

## Quick start

### 1. Install dependencies

```bash
npm ci
```

### 2. Create local environment files

```bash
cp .env.example .local_env
cp .env.example .local_env.e2e
```

Environment files are ignored by Git. Never put real secrets in committed files.

### 3. Start local Supabase

```bash
npm run supabase:start
npx supabase status -o env
```

The local stack uses these default endpoints:

| Service              | Address                                                   |
| -------------------- | --------------------------------------------------------- |
| Supabase API         | `http://127.0.0.1:54321`                                  |
| Postgres             | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase Studio      | `http://127.0.0.1:54323`                                  |
| Inbucket mail viewer | `http://127.0.0.1:54324`                                  |

Copy the values reported by `supabase status -o env` into `.local_env`:

```dotenv
NG_APP_SUPABASE_URL=<API_URL>
NG_APP_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY>
SUPABASE_DB_URL=<DB_URL>
```

`NG_APP_SUPABASE_FUNCTIONS_URL` is optional; when omitted, Tickist derives it from the Supabase URL.

For local E2E, `.local_env.e2e` needs the application URL/key plus `SUPABASE_E2E_DB_URL`. CI generates that file from its local Supabase stack. In normal development, use a dedicated test database or branch.

### 4. Run the app

```bash
npm run start
```

The app is available at [http://localhost:4200](http://localhost:4200). The startup script first verifies that the local Tickist Supabase stack is running; it deliberately never stops another local Supabase project.

## Daily commands

```bash
# Run the app
npm run start

# Static checks, unit tests, and production build
npm exec nx lint tickist-web
npm exec nx test tickist-web
npm exec nx build tickist-web --configuration production

# Dedicated MCP checks
npm exec nx lint mcp
npm exec nx test mcp
npm exec nx typecheck mcp
npm exec nx build mcp
npm exec nx worker:dry-run mcp

# Playwright E2E in the CI browser configuration
npx nx e2e tickist-web-e2e -- --project=chromium

# Check E2E test code itself
npm exec nx lint tickist-web-e2e

# Check formatting
npm exec nx format:check
```

### E2E database safety

E2E setup resets `SUPABASE_E2E_DB_URL`. It refuses to reset a database matching `SUPABASE_REMOTE_DB_URL`, and it also rejects the normal development database by default.

Use a dedicated E2E database or branch. A local-only exception is available for deliberate debugging:

```bash
E2E_ALLOW_LOCAL_DB_RESET=true \
  npx nx e2e tickist-web-e2e -- --project=chromium
```

That exception only permits `localhost` or `127.0.0.1`; it cannot authorize a remote reset.

## Database workflow

Migrations are ordered SQL files in [`supabase/migrations`](supabase/migrations). Keep every schema change additive and backward-compatible: production users can be running older frontend code while a deployment is in progress.

```bash
# Local database
npm run db:push:local
npm run db:pull:local
npm run db:types:local
npm run db:reset:local

# Remote database — use with care
npm run db:push:remote
npm run db:pull:remote
npm run db:types:remote
```

`db:reset:local` recreates the local database. Do **not** run `db:reset:remote` as part of normal development: it is destructive and targets `SUPABASE_REMOTE_DB_URL`.

After changing the schema, reset the local stack if needed, regenerate types, and add a new numbered migration. Do not rename or edit a migration that has already reached a shared environment.

### Demo account and encrypted backups

Tickist includes guarded operator tools for a deterministic English demo account and complete encrypted Supabase backups:

```bash
npm run demo:seed
npm run demo:seed:test
npm run db:backup:test
npm run db:backup:remote
```

The demo dry run makes no connection. Applying it requires an administrative Supabase secret and explicit remote-project confirmation; replacement additionally requires the exact marked demo email. Backups include Postgres, Auth, migration history, Storage metadata, and physical Storage objects, then authenticate and verify the encrypted archive.

Read [demo data seeding](doc/demo-data-seeding.md) and [encrypted database backups](doc/encrypted-database-backups.md) before applying either operator workflow.

## Environment and secrets

`.env.example` documents the supported variables. The important groups are:

| Purpose                    | Variables                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| Browser app                | `NG_APP_SUPABASE_URL`, `NG_APP_SUPABASE_PUBLISHABLE_KEY`, optional `NG_APP_SUPABASE_FUNCTIONS_URL` |
| Local database tooling     | `SUPABASE_DB_URL`                                                                                  |
| E2E                        | `SUPABASE_E2E_DB_URL` plus browser app variables                                                   |
| Remote tooling             | `SUPABASE_REMOTE_DB_URL`, `SUPABASE_PROJECT_REF`                                                   |
| Edge Functions and workers | `SUPABASE_SECRET_KEY`, `INTERNAL_FUNCTION_SECRET`                                                  |
| MCP production smoke tests | `MCP_SMOKE_EMAIL`, `MCP_SMOKE_PASSWORD` (dedicated test user)                                      |
| Email delivery             | `EMAIL_FROM`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`                           |

`SUPABASE_SECRET_KEY`, database URLs with passwords, AWS credentials, and `INTERNAL_FUNCTION_SECRET` are server-side secrets. Never expose them through Angular runtime configuration or commit them to the repository. Legacy `*_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `ROUTINE_RUNNER_SECRET` names exist only as rollout fallbacks; use the publishable/secret names above for new configuration.

The production MCP smoke test mints a fresh OAuth access token on every run through dynamic client registration, authorization code, and S256 PKCE, then revokes the resulting grant. Do not store an expiring OAuth JWT as a repository secret.
The personal `tk_` compatibility check runs only when `MCP_PERSONAL_SMOKE_TOKEN` is configured; adding that secret enables the check automatically.

## Notifications and email

Application email is intentionally decoupled from the browser:

1. Tickist writes a notification to the outbox.
2. Supabase schedulers invoke digest and reminder workers.
3. `send-emails` sends batches through AWS SES and records delivery state.

Read [docs/EMAIL.md](docs/EMAIL.md) for SES SMTP, DNS, outbox behavior, schedulers, retries, and the security model. [DEPLOY.md](DEPLOY.md) covers deployment and smoke-testing the mail stack.

## CI and deployment

Every push and pull request runs lint and unit tests. Pushes to `develop` and `master` also start a local Supabase stack and run Chromium Playwright E2E.

Production deployment is triggered by a push to `master`. The workflow:

1. verifies lint, unit tests, and a production build;
2. pushes Supabase migrations;
3. configures and verifies the Supabase OAuth server, dynamic registration, consent path, and MCP token hook;
4. syncs required Edge Function secrets and scheduler Vault values;
5. deploys Edge Functions;
6. builds the application and MCP projects;
7. deploys the application and MCP Cloudflare Workers separately;
8. verifies MCP health, OAuth metadata, authentication challenges, OAuth and personal-token authentication, and modern and legacy protocol calls.

Deployment configuration and required GitHub secrets are defined in [`.github/workflows/production.yml`](.github/workflows/production.yml). Treat `SUPABASE_REMOTE_DB_URL` as production infrastructure, not as a convenience variable for local work.

## Contributing

1. Branch from `develop` using a focused name such as `rewrite/<feature>` or `supabase/<area>`.
2. Keep Angular components standalone and prefer signals. Use built-in Angular template control flow (`@if`, `@for`, `@switch`).
3. Add or update Vitest and Playwright coverage when a user journey, routing rule, or data contract changes.
4. Before review, run lint, unit tests, a production build, and relevant E2E.
5. Use imperative, scoped commits, for example `feat(tasks): add completion badge`.

The full working agreement is in [AGENTS.md](AGENTS.md). See [MIGRATION_PLAN.md](MIGRATION_PLAN.md) for migration and architecture decisions.

## Useful links

- [Supabase schema and Edge Functions](supabase/README.md)
- [Email delivery and schedulers](docs/EMAIL.md)
- [Deployment guide](DEPLOY.md)
- [LLM discovery file](apps/tickist-web/public/llm.txt) and [full LLM reference](apps/tickist-web/public/llm-full.txt)
- [Repository knowledge base](doc/README.md)
- [Repository guidelines](AGENTS.md)
