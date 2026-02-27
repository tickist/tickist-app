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

# Writes to remote Supabase using service role key
npm run migration:firebase:import:remote
```

Required env vars:

```
NG_APP_SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Reports are written to `reports/firebase-migration/<timestamp>/`.

## Edge Functions

- `functions/task-reminder/index.ts`: logs a notification whenever a task event occurs. This is the Supabase replacement for the Firebase function that wrote into `notifications`.
- `functions/project-update/index.ts`: notifies collaborators when they are added/removed from a shared project.
- `functions/routine-runner/index.ts`: cron-friendly endpoint that processes `routine_reminders` entries and writes notifications (placeholder for real automation).

Run locally (requires Supabase CLI):

```bash
cd supabase
supabase functions serve task-reminder --env-file .env
supabase functions serve project-update --env-file .env
supabase functions serve routine-runner --env-file .env
```

Required env vars:

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Manual invocation (local):

```bash
curl -X POST http://localhost:54321/functions/v1/task-reminder \
  -H 'Content-Type: application/json' \
  -d '{"taskId":"<uuid>","event":"completed"}'

curl -X POST http://localhost:54321/functions/v1/project-update \
  -H 'Content-Type: application/json' \
  -d '{"projectId":"<uuid>","event":"shared","title":"New shared project","description":"Someone shared a project with you","recipients":["<auth-user-id>"]}'

curl -X POST http://localhost:54321/functions/v1/routine-runner
```
