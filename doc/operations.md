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
npm exec nx run-many -t oxlint --all
npm exec nx lint tickist-web
npm exec nx test tickist-web
npm exec nx build tickist-web --configuration production
npm exec nx lint tickist-web-e2e
npx nx e2e tickist-web-e2e -- --project=chromium
```

Choose checks that exercise the change; the commands above are available targets, not a mandatory sequence for every edit. Instruction/documentation-only work uses explicit-file formatting and configuration/link checks plus `git diff --check`. See [Agent tooling](agent-tooling.md).

Oxlint runs through the official `@nx/oxlint` plugin on all four code projects. The vendored [anti-slop rules](../tools/oxlint/anti-slop/UPSTREAM.md) are configured in the root `.oxlintrc.json`. ESLint remains in place for Angular templates and rules that Oxlint does not cover.

Add focused Vitest coverage for services and components. Add Playwright coverage for critical user journeys, especially when changing authentication, routes, data contracts, task/project interactions, or public metadata.

## Database workflow

Use `npm run db:push:local`, `db:pull:local`, `db:types:local`, and `db:reset:local` for the local environment. Remote commands deliberately use `.env` and `SUPABASE_REMOTE_DB_URL`.

Treat remote resets as destructive. Production schema changes belong in a new, numbered, backward-compatible migration. Never reuse an existing migration number and do not edit a migration that has already been shared.

Repository-managed operator tools also provide a deterministic English demo account and encrypted disaster-recovery backups:

- [Demo data seeding](demo-data-seeding.md)
- [Encrypted database backups](encrypted-database-backups.md)
- [Account deletion](account-deletion.md) — guarded operator workflow after verifying an email request

## E2E isolation

Playwright resets `SUPABASE_E2E_DB_URL`, not the normal application database. It rejects a target matching `SUPABASE_REMOTE_DB_URL`. It also rejects the normal local database unless `E2E_ALLOW_LOCAL_DB_RESET=true` is intentionally set; the opt-in only permits localhost. Obtain explicit authorization to reset ordinary local data before setting that flag. Check the database and browser API targets together; a local-looking variable alone does not prove the test setup is isolated.

CI creates its E2E environment from a local Supabase stack, runs Chromium on pushes to `develop` and `master`, and tears the stack down afterwards.

## Release flow

- Develop directly on `develop`; create a feature branch only with the owner's explicit approval.
- CI runs lint and unit tests for pushes and pull requests.
- The production workflow runs from `master`.
- Production deployment validates the app, pushes migrations, syncs Edge Function secrets and scheduler Vault values, deploys Edge Functions, and deploys the Cloudflare Worker.

The browser build accepts only the explicitly listed public `NG_APP_*` values in `apps/tickist-web/vite.config.mts`. Database connection strings, service keys, AWS credentials, and internal function secrets belong only in server-side deployment steps. CI runs `npm run security:browser-artifacts`, which builds with unique fake secrets and scans every generated browser file, including lazy chunks and source maps, for raw and encoded values. The production workflow also scans the final frontend files against its actual private values before deployment without printing those values.

If a production database password is found in a public artifact, treat it as compromised. Prepare all dependent connection strings, then reset the password in the Supabase Dashboard as soon as the replacement can be propagated. Update `SUPABASE_REMOTE_DB_URL` in GitHub Actions and every local or backup configuration that uses it; check other consumers before closing the incident. Deploy the clean build, inspect current and historical public asset URLs, and purge relevant CDN and service-worker caches. Removing the password from source or deleting one asset does not revoke the exposed password; rotation is required. Do not paste credentials into logs or issue reports.

Read `DEPLOY.md` and `docs/EMAIL.md` before changing production email, scheduler, or secret configuration.

Application history cleanup is documented in [data retention](data-retention.md); apply migration 0025 before updating the project-invite function.

- [Registration and legal documents](legal-registration.md) — versioned public documents, server acceptance records and the publication gate.

## Worker logs

Both `wrangler.toml` and `wrangler.mcp.toml` enable Workers Logs and invocation
logs through `[observability.logs]`. Each Worker's next deployment applies its
configuration; editing these files does not enable logs on the deployed Worker.
Invocation logs include request/response metadata such as the request URL,
alongside application console messages and errors. Keep credentials and user
content out of custom log messages.

Cloudflare's [Workers Logs documentation](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
specifies retention of 3 days on Workers Free and 7 days on Workers Paid. The
Workers plan is separate from the domain's plan. These files do not configure
external log destinations.

The app uses `assets.run_worker_first = ["/*", "!/assets/*", "!/images/*"]` so SPA HTML, `/env.js`, legal noindex and consent/security headers actually execute the Worker. Bundles and images retain direct asset delivery. Check navigation responses as well as direct requests; SPA asset fallback can otherwise bypass the Worker.

The Worker builds the Content-Security-Policy per request in `apps/tickist-web/worker.ts`. `connect-src` and `img-src` allow only `'self'`, the configured Supabase origin (plus its `wss://` Realtime origin and the functions origin), Cloudflare Web Analytics and the Google Analytics endpoints; local Supabase hosts are not allowed in production. The inline theme scripts in `apps/tickist-web/index.html` are allowed by SHA-256 hash; changing them requires updating `INLINE_SCRIPT_HASHES`, and `tests/worker.spec.ts` fails until the hashes match. Paths that bypass the Worker (`/assets/*`, `/images/*`) get `X-Content-Type-Options: nosniff` from `apps/tickist-web/public/_headers`, which Workers Static Assets applies to directly served assets. The build no longer copies repository Markdown files (such as `AGENTS.md` or `README.md`) into the public site.

## Administrator email monitoring

After migration 0031, grant panel access by setting `public.profiles.is_admin` for a verified existing Auth user in Supabase Table Editor. The database rejects browser writes to this flag. See [email monitoring](email-monitoring.md) for migrations 0029–0031, server-side settings, isolated database tests and deployment verification. The monitor never changes the SES sending quota.
