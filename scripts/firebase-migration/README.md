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

# 3) import to remote with one shared password prompt
npm run migration:firebase:import:remote:shared-password

# 4) import + send reset password emails
npm run migration:firebase:import:remote:with-resets

# 5) backfill existing app_users.avatar_url -> auth metadata (local)
npm run migration:firebase:avatars:backfill:local

# 6) backfill existing app_users.avatar_url -> auth metadata (remote)
npm run migration:firebase:avatars:backfill:remote
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
- `--prompt-shared-password` (asks once for one shared password for all new users)
- `--reset-redirect-to <url>`
- `--report-dir <dir>`
- `--allow-non-empty`

### Shared password mode

Use this only for controlled migration/testing scenarios. The password is prompted in terminal,
not written to repository files, and not included in reports.

```bash
dotenv -e .env -- node scripts/firebase-migration/import.mjs \
  --source ./backup_from_firebase \
  --target remote \
  --scope active \
  --prompt-shared-password
```

## Reports

Each run writes:

- `import-summary.json`
- `rejects.csv`
- `email-merge.csv`

Default output directory:

`reports/firebase-migration/<timestamp>/`

## Avatar metadata backfill

For legacy users imported with `app_users.avatar_url`, run one-off backfill to align with
the app source of truth (`auth.users.raw_user_meta_data.avatar_url`).

```bash
# Preview only
dotenv -e .env -- node scripts/firebase-migration/backfill-avatar-metadata.mjs \
  --target remote \
  --dry-run

# Apply updates
dotenv -e .env -- node scripts/firebase-migration/backfill-avatar-metadata.mjs \
  --target remote
```

Backfill report files:

- `avatar-backfill-summary.json`
- `avatar-backfill-errors.json`
