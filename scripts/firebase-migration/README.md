# Firebase Day-0 Importer

One-time migration tool for hard cutover from Firebase dump JSON to Supabase.

## Scope

- Imports only active state:
  - `projects`: `isActive = true` or `isInbox = true`
  - `tasks`: `isActive = true` and `isDone != true`
  - `tags`: only those referenced by imported tasks
  - `users`: only users referenced by imported entities
- Skips historical notifications.
- Skips orphaned records and writes them to `rejects.csv`.
- Merges duplicate emails into one canonical user (e.g. `wielki.freeman@gmail.com`).

## Required env vars

- `NG_APP_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

For remote migration also keep `SUPABASE_REMOTE_DB_URL` for schema push/reset scripts.

## Commands

```bash
# 1) dry run locally (no writes)
npm run migration:firebase:dry-run:local

# 2) import to remote Supabase (writes)
npm run migration:firebase:import:remote

# 3) import + send reset password emails
npm run migration:firebase:import:remote:with-resets
```

## Direct CLI usage

```bash
node scripts/firebase-migration/import.mjs \
  --source ./backup_from_firebase \
  --target remote \
  --scope active
```

Optional flags:

- `--dry-run`
- `--send-reset-links`
- `--reset-redirect-to <url>`
- `--report-dir <dir>`
- `--allow-non-empty`

## Reports

Each run writes:

- `import-summary.json`
- `rejects.csv`
- `email-merge.csv`

Default output directory:

`reports/firebase-migration/<timestamp>/`
