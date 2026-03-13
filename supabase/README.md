# Supabase schema

- `migrations/0001_init_schema.sql` mirrors the current Firestore collections (`projects`, `tasks`, `tags`, `shareWith`, `steps`) with relational tables.
- IDs are `uuid_generate_v4()` by default; when migrating data from Firebase keep existing IDs by inserting them explicitly.
- Each table references `auth.users` so you can rely on Supabase Auth for ownership/permissions.

## Applying migrations locally

```bash
supabase start
supabase db reset --db-url "$YOUR_SUPABASE_DB_URL" --file supabase/migrations/0001_init_schema.sql
```

Or manually:

```bash
psql "$YOUR_SUPABASE_DB_URL" -f supabase/migrations/0001_init_schema.sql
```

Keep future schema changes as new numbered files in `supabase/migrations/`.

## Avatar storage

Migration `0005_avatar_storage.sql` creates a public Storage bucket `avatars` with:

- max file size `2 MB`,
- allowed MIME types: `image/png`, `image/jpeg`, `image/webp`,
- RLS policies restricting writes to `avatars/<auth.uid()>/...`.

The app stores avatar image URL in `auth.users.raw_user_meta_data.avatar_url`.
Legacy values from `public.app_users.avatar_url` can be backfilled with:

```bash
npm run migration:firebase:avatars:backfill:remote
```

## Firebase Day-0 import

Use the one-time importer from `scripts/firebase-migration/import.mjs`.

```bash
# No writes, generates reports only
npm run migration:firebase:dry-run:local

# Writes to remote Supabase using secret key
npm run migration:firebase:import:remote
```

Required env vars:

```
NG_APP_SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SECRET_KEY=...
```

Reports are written to `reports/firebase-migration/<timestamp>/`.

## Edge Functions

- `functions/task-reminder/index.ts`: logs a notification whenever a task event occurs. This is the Supabase replacement for the Firebase function that wrote into `notifications`.
- `functions/project-update/index.ts`: notifies collaborators when they are added/removed from a shared project.
- `functions/routine-runner/index.ts`: cron-friendly endpoint that processes `routine_reminders` entries and writes notifications (placeholder for real automation).
- `functions/notification-digest-runner/index.ts`: cron-friendly endpoint that enqueues daily and weekly email summaries based on `notification_preferences`.
- `functions/enqueue-notification/index.ts`: authenticated enqueue endpoint that writes to `public.email_outbox`.
- `functions/send-emails/index.ts`: internal-secret protected batch worker that sends queued emails through AWS SES API.

Run locally (requires Supabase CLI):

```bash
cd supabase
supabase functions serve task-reminder --env-file .env
supabase functions serve project-update --env-file .env
supabase functions serve routine-runner --env-file .env
supabase functions serve notification-digest-runner --env-file .env
supabase functions serve enqueue-notification --env-file .env
supabase functions serve send-emails --env-file .env
```

Required env vars:

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxx
INTERNAL_FUNCTION_SECRET=<strong-random-secret>
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
EMAIL_FROM=no-reply@tickist.com
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
EMAIL_RATE_LIMIT_PER_MINUTE=1
EMAIL_RATE_LIMIT_PER_HOUR=60
EMAIL_RATE_LIMIT_PER_DAY=500
```

Temporary deprecated fallbacks:

```
SUPABASE_SERVICE_ROLE_KEY=...
ROUTINE_RUNNER_SECRET=<strong-random-secret>
SUPABASE_ANON_KEY=sb_publishable_xxx
```

Manual invocation (local):

```bash
curl -X POST http://localhost:54321/functions/v1/task-reminder \
  -H 'Content-Type: application/json' \
  -d '{"taskId":"<uuid>","event":"completed"}'

curl -X POST http://localhost:54321/functions/v1/project-update \
  -H 'Content-Type: application/json' \
  -d '{"projectId":"<uuid>","event":"shared","title":"New shared project","description":"Someone shared a project with you","recipients":["<auth-user-id>"]}'

curl -X POST http://localhost:54321/functions/v1/routine-runner \
  -H 'x-internal-function-secret: <INTERNAL_FUNCTION_SECRET>'

curl -X POST http://localhost:54321/functions/v1/notification-digest-runner \
  -H 'x-internal-function-secret: <INTERNAL_FUNCTION_SECRET>'

curl -X POST http://localhost:54321/functions/v1/enqueue-notification \
  -H 'Authorization: Bearer <USER_ACCESS_TOKEN>' \
  -H 'apikey: <SUPABASE_PUBLISHABLE_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"subject":"Test","text":"Hello from outbox","type":"notification"}'

curl -X POST http://localhost:54321/functions/v1/send-emails \
  -H 'x-internal-function-secret: <INTERNAL_FUNCTION_SECRET>' \
  -H 'apikey: <SUPABASE_PUBLISHABLE_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"limit":25,"dry_run":true}'
```

Szczegółowa instrukcja SES/SMTP/DNS/scheduler: `docs/EMAIL.md`.
