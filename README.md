# Tickist

[![CI](https://github.com/tickist/tickist-app/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/tickist/tickist-app/actions/workflows/ci.yml)

Tickist is a task and project management application built with Angular + Supabase.
The project is developed as an Nx monorepo, with one actively maintained application: `tickist-web`.

## What This Project Is

Tickist focuses on everyday work organization:

- tasks with due dates, priorities, and descriptions,
- projects, including hierarchical projects,
- tags and filtering,
- steps/subtasks,
- recurring task rules,
- account settings and user preferences,
- email notifications through Supabase Edge Functions + AWS SES.

## Tech Stack

- Angular 21 (standalone components, signals)
- Nx 22
- Vite + Vitest
- TailwindCSS + DaisyUI
- Supabase (Postgres, Auth, Storage, Edge Functions)
- Playwright (E2E)

## Repository Structure

- `apps/tickist-web/` - main frontend application
- `apps/tickist-web/src/app/` - feature modules (`auth`, `app-shell`, `dashboard`, `tags`, `task-fab`) plus `core` and `data`
- `supabase/migrations/` - database migrations
- `supabase/functions/` - edge functions
- `docs/` - operational documentation, such as email/SES

## Local Quick Start

1. Install dependencies:

```bash
npm install
```

2. Prepare environment files:

```bash
cp .env.example .env
cp .env.example .local_env
```

3. Fill in the required variables in `.local_env`:

- `NG_APP_SUPABASE_URL`
- `NG_APP_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_E2E_DB_URL`
- `SUPABASE_REMOTE_DB_URL`
- `SUPABASE_SECRET_KEY`
- `INTERNAL_FUNCTION_SECRET`

4. Start the application:

```bash
npm run start
```

The application starts at `http://localhost:4200`.

## Main Commands

```bash
# development
npm run start

# build
npm run build

# unit tests
npm run test

# e2e
npm exec nx e2e tickist-web-e2e

# lint
npm exec nx lint tickist-web
```

## Workflow Supabase

```bash
# local database
npm run db:push:local
npm run db:pull:local
npm run db:types:local
npm run db:reset:local

# remote database
npm run db:push:remote
npm run db:pull:remote
npm run db:types:remote
npm run db:reset:remote
```

Running local Supabase:

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:stop
```

## Email and Notifications

- Auth email, such as password resets and account confirmations, is sent through SMTP configured in Supabase.
- Application notifications use the `public.email_outbox` outbox and the following functions:
  - `notification-digest-runner`
  - `enqueue-notification`
  - `send-emails`

Details:

- [docs/EMAIL.md](docs/EMAIL.md)
- [DEPLOY.md](DEPLOY.md)

## Quality and CI

Before opening a PR, run:

```bash
npm exec nx format:check
npm exec nx lint tickist-web
npm exec nx test tickist-web
npm exec nx build tickist-web
```

## Additional Documentation

- [MIGRATION_PLAN.md](MIGRATION_PLAN.md) - migration plan and architecture decisions
- [AGENTS.md](AGENTS.md) - repository working guidelines
