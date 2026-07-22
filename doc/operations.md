# Operations

## Local development

Install dependencies with `npm ci`. Copy `.env.example` to `.local_env`, then start the local Supabase stack with `npm run supabase:start`. `npx supabase status -o env` reports the local API URL, publishable key, and database URL needed in `.local_env`.

`npm run start` checks that the local Tickist stack is running and serves the app at port 4200. The guard is intentionally non-destructive: it will not stop another local Supabase project if the required ports are in use.

Default local endpoints:

| Service  | Port  |
| -------- | ----- |
| API      | 54321 |
| Postgres | 54322 |
| Studio   | 54323 |
| Inbucket | 54324 |

## Quality checks

```bash
npm exec nx lint tickist-web
npm exec nx test tickist-web
npm exec nx build tickist-web --configuration production
npm exec nx lint tickist-web-e2e
npx nx e2e tickist-web-e2e -- --project=chromium
```

Add focused Vitest coverage for services and components. Add Playwright coverage for critical user journeys, especially when changing authentication, routes, data contracts, task/project interactions, or public metadata.

## Database workflow

Use `npm run db:push:local`, `db:pull:local`, `db:types:local`, and `db:reset:local` for the local environment. Remote commands deliberately use `.env` and `SUPABASE_REMOTE_DB_URL`.

Treat remote resets as destructive. Production schema changes belong in a new, numbered, backward-compatible migration. Never reuse an existing migration number and do not edit a migration that has already been shared.

## E2E isolation

Playwright resets `SUPABASE_E2E_DB_URL`, not the normal application database. It rejects a target matching `SUPABASE_REMOTE_DB_URL`. It also rejects the normal local database unless `E2E_ALLOW_LOCAL_DB_RESET=true` is intentionally set; the opt-in only permits localhost.

CI creates its E2E environment from a local Supabase stack, runs Chromium on pushes to `develop` and `master`, and tears the stack down afterwards.

## Release flow

- Develop on branches from `develop`.
- CI runs lint and unit tests for pushes and pull requests.
- The production workflow runs from `master`.
- Production deployment validates the app, pushes migrations, syncs Edge Function secrets and scheduler Vault values, deploys Edge Functions, and deploys the Cloudflare Worker.

Read `DEPLOY.md` and `docs/EMAIL.md` before changing production email, scheduler, or secret configuration.
