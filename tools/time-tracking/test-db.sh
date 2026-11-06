#!/usr/bin/env bash
# Disposable, unexposed container only. Never uses any application DB URL.
# Applies every migration on stubbed auth/storage schemas, then runs the
# time tracking integration test, which rolls back its fixtures.
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
container_id="$(docker run --rm -d -e POSTGRES_PASSWORD=local-time-tracking-test-only \
  public.ecr.aws/supabase/postgres:17.6.1.171 postgres \
  -c shared_preload_libraries=pg_cron,pg_net -c cron.database_name=postgres)"
trap 'docker rm -f "$container_id" >/dev/null' EXIT
ready=false
for attempt in $(seq 1 60); do
  if docker exec "$container_id" pg_isready -h 127.0.0.1 -U supabase_admin >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
if [ "$ready" != true ]; then echo "Disposable database did not start"; exit 1; fi
sleep 3
psql_test() { docker exec -i "$container_id" psql -q -U supabase_admin -d postgres -v ON_ERROR_STOP=1 "$@"; }
psql_test <<'SQL'
create schema if not exists storage;
create table if not exists storage.buckets(id text primary key, name text not null, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[], owner uuid, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
  name text, owner uuid, metadata jsonb, created_at timestamptz default now(), updated_at timestamptz default now());
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$$;
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated, service_role;
alter table auth.users add column if not exists deleted_at timestamptz, add column if not exists email text,
  add column if not exists email_confirmed_at timestamptz, add column if not exists raw_user_meta_data jsonb default '{}',
  add column if not exists raw_app_meta_data jsonb default '{}', add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(), add column if not exists encrypted_password text,
  add column if not exists last_sign_in_at timestamptz, add column if not exists is_anonymous boolean default false,
  add column if not exists banned_until timestamptz, add column if not exists confirmed_at timestamptz;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
grant execute on function auth.jwt() to anon, authenticated, service_role;
SQL
for migration in "$root"/supabase/migrations/*.sql; do
  psql_test < "$migration" >/dev/null 2>&1 || { echo "Migration failed: $(basename "$migration")"; psql_test < "$migration" >/dev/null; exit 1; }
done
psql_test -t < "$root/tools/time-tracking/time-tracking.integration.sql" | grep -q "Time tracking integration passed"
echo "Time tracking database integration passed"
