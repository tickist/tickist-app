create extension if not exists pgcrypto;

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  to_email text not null,
  subject text not null,
  html text null,
  text text null,
  type text not null default 'notification',
  dedupe_key text not null,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  last_error text null,
  sent_at timestamptz null,
  retry_at timestamptz null,
  constraint email_outbox_status_check
    check (status in ('queued', 'sending', 'sent', 'failed', 'dead')),
  constraint email_outbox_content_check
    check (
      coalesce(length(nullif(btrim(html), '')), 0) > 0
      or coalesce(length(nullif(btrim(text), '')), 0) > 0
    )
);

create unique index if not exists email_outbox_dedupe_key_idx
  on public.email_outbox (dedupe_key);

create index if not exists email_outbox_status_retry_created_idx
  on public.email_outbox (status, retry_at, created_at);

create table if not exists public.email_rate_limit_minute (
  bucket_minute timestamptz primary key,
  sent_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_email_outbox_updated_at on public.email_outbox;
create trigger set_email_outbox_updated_at
before update on public.email_outbox
for each row
execute function public.set_updated_at();

drop trigger if exists set_email_rate_limit_minute_updated_at on public.email_rate_limit_minute;
create trigger set_email_rate_limit_minute_updated_at
before update on public.email_rate_limit_minute
for each row
execute function public.set_updated_at();

alter table public.email_outbox enable row level security;
alter table public.email_rate_limit_minute enable row level security;

drop policy if exists email_outbox_service_role_all on public.email_outbox;
create policy email_outbox_service_role_all
  on public.email_outbox
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists email_rate_limit_minute_service_role_all on public.email_rate_limit_minute;
create policy email_rate_limit_minute_service_role_all
  on public.email_rate_limit_minute
  for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.email_outbox from anon, authenticated;
revoke all on table public.email_rate_limit_minute from anon, authenticated;
grant select, insert, update, delete on public.email_outbox to service_role;
grant select, insert, update, delete on public.email_rate_limit_minute to service_role;

create or replace function public.enqueue_email(
  p_to_email text,
  p_subject text,
  p_html text default null,
  p_text text default null,
  p_type text default 'notification',
  p_dedupe_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_to_email text := lower(trim(coalesce(p_to_email, '')));
  v_subject text := trim(coalesce(p_subject, ''));
  v_html text := nullif(trim(coalesce(p_html, '')), '');
  v_text text := nullif(trim(coalesce(p_text, '')), '');
  v_type text := coalesce(nullif(trim(p_type), ''), 'notification');
  v_dedupe_key text := trim(coalesce(p_dedupe_key, ''));
begin
  if v_to_email = '' then
    raise exception 'to_email is required' using errcode = '22023';
  end if;

  if v_to_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
    raise exception 'to_email is invalid' using errcode = '22023';
  end if;

  if v_subject = '' then
    raise exception 'subject is required' using errcode = '22023';
  end if;

  if v_html is null and v_text is null then
    raise exception 'html or text is required' using errcode = '22023';
  end if;

  if v_dedupe_key = '' then
    raise exception 'dedupe_key is required' using errcode = '22023';
  end if;

  insert into public.email_outbox (
    to_email,
    subject,
    html,
    text,
    type,
    dedupe_key
  )
  values (
    v_to_email,
    v_subject,
    v_html,
    v_text,
    v_type,
    v_dedupe_key
  )
  on conflict (dedupe_key) do nothing
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.claim_email_outbox(
  p_limit integer default 25
)
returns setof public.email_outbox
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 25), 50));
begin
  return query
  with candidates as (
    select e.id
    from public.email_outbox e
    where e.status = 'queued'
      and (e.retry_at is null or e.retry_at <= now())
    order by e.created_at asc
    for update skip locked
    limit v_limit
  )
  update public.email_outbox e
  set
    status = 'sending',
    last_error = null
  from candidates c
  where e.id = c.id
  returning e.*;
end;
$$;

create or replace function public.release_email_outbox(
  p_ids uuid[],
  p_reason text default null,
  p_retry_seconds integer default 60
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_retry_seconds integer := greatest(0, coalesce(p_retry_seconds, 60));
begin
  if p_ids is null or array_length(p_ids, 1) is null then
    return 0;
  end if;

  update public.email_outbox e
  set
    status = 'queued',
    retry_at = now() + make_interval(secs => v_retry_seconds),
    last_error = coalesce(p_reason, e.last_error)
  where e.id = any(p_ids)
    and e.status = 'sending';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.reserve_email_send_slot(
  p_per_minute integer default 1,
  p_per_hour integer default 60,
  p_per_day integer default 500
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_bucket_minute timestamptz := date_trunc('minute', v_now);
  v_day_start_utc timestamptz := (date_trunc('day', v_now at time zone 'utc') at time zone 'utc');
  v_count_minute integer := 0;
  v_count_hour integer := 0;
  v_count_day integer := 0;
begin
  if coalesce(p_per_minute, 0) <= 0
    or coalesce(p_per_hour, 0) <= 0
    or coalesce(p_per_day, 0) <= 0 then
    raise exception 'rate limits must be > 0' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('public.email_rate_limit_minute', 0));

  delete from public.email_rate_limit_minute
  where bucket_minute < v_now - interval '2 days';

  insert into public.email_rate_limit_minute (bucket_minute, sent_count)
  values (v_bucket_minute, 0)
  on conflict (bucket_minute) do nothing;

  select sent_count
    into v_count_minute
  from public.email_rate_limit_minute
  where bucket_minute = v_bucket_minute
  for update;

  select coalesce(sum(sent_count), 0)::integer
    into v_count_hour
  from public.email_rate_limit_minute
  where bucket_minute >= (v_now - interval '1 hour');

  select coalesce(sum(sent_count), 0)::integer
    into v_count_day
  from public.email_rate_limit_minute
  where bucket_minute >= v_day_start_utc;

  if v_count_minute >= p_per_minute
    or v_count_hour >= p_per_hour
    or v_count_day >= p_per_day then
    return false;
  end if;

  update public.email_rate_limit_minute
  set sent_count = sent_count + 1
  where bucket_minute = v_bucket_minute;

  return true;
end;
$$;

revoke all on function public.enqueue_email(text, text, text, text, text, text)
from public, anon, authenticated;
revoke all on function public.claim_email_outbox(integer)
from public, anon, authenticated;
revoke all on function public.release_email_outbox(uuid[], text, integer)
from public, anon, authenticated;
revoke all on function public.reserve_email_send_slot(integer, integer, integer)
from public, anon, authenticated;

grant execute on function public.enqueue_email(text, text, text, text, text, text)
to service_role;
grant execute on function public.claim_email_outbox(integer)
to service_role;
grant execute on function public.release_email_outbox(uuid[], text, integer)
to service_role;
grant execute on function public.reserve_email_send_slot(integer, integer, integer)
to service_role;
