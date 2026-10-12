#!/usr/bin/env bash
# Disposable, unexposed container only. Never uses any application DB URL.
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
container_id="$(docker run --rm -d -e POSTGRES_PASSWORD=local-monitor-test-only \
  public.ecr.aws/supabase/postgres:17.6.1.171 postgres \
  -c shared_preload_libraries=pg_cron,pg_net -c cron.database_name=postgres)"
trap 'docker rm -f "$container_id" >/dev/null' EXIT
ready=false
for attempt in $(seq 1 40); do
  if docker exec "$container_id" pg_isready -h 127.0.0.1 -U supabase_admin >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
if [ "$ready" != true ]; then echo "Disposable database did not start"; exit 1; fi
psql_test() { docker exec -i "$container_id" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 "$@"; }
psql_test <<'SQL'
create schema if not exists auth;
create table if not exists auth.users(id uuid primary key, raw_user_meta_data jsonb not null default '{}'::jsonb);
do $$ begin
  if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
  if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists(select from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
end $$;
grant usage on schema public, auth to anon, authenticated, service_role;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid;
$$;
SQL
psql_test < "$root/supabase/migrations/0008_email_outbox_and_worker.sql"
psql_test < "$root/supabase/migrations/0029_email_delivery_monitor.sql"
psql_test <<'SQL'
insert into auth.users(id) values
 ('ac000000-0000-4000-8000-000000000001'),
 ('ac000000-0000-4000-8000-000000000002');
insert into public.app_administrators(user_id) values ('ac000000-0000-4000-8000-000000000001');
SQL
psql_test < "$root/supabase/migrations/0031_admin_profiles.sql"
psql_test < "$root/tools/email-monitor/monitor.integration.sql"
psql_test <<'SQL'
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault with schema vault;
SQL
psql_test < "$root/supabase/migrations/0030_schedule_email_delivery_monitor.sql"
psql_test -c "select jobname,schedule from cron.job where jobname='email-delivery-monitor-every-5-minutes';"
echo "Email monitor database integration passed"
