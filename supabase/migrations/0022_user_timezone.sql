-- Persist the user's IANA timezone so server-side task recurrence can use the
-- same calendar day as the browser application.
alter table public.app_users
  add column if not exists timezone text;

update public.app_users
set timezone = 'Europe/Warsaw';

insert into public.app_users (auth_user_id, username, timezone)
select
  users.id,
  coalesce(
    nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(users.email, ''), '@', 1), ''),
    users.id::text
  ),
  'Europe/Warsaw'
from auth.users as users
where not exists (
  select 1
  from public.app_users
  where app_users.auth_user_id = users.id
);

alter table public.app_users
  alter column timezone set default 'Europe/Warsaw',
  alter column timezone set not null;

create or replace function public.normalize_user_timezone(candidate text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select pg_timezone_names.name
      from pg_catalog.pg_timezone_names
      where pg_timezone_names.name = nullif(btrim(candidate), '')
      limit 1
    ),
    'Europe/Warsaw'
  );
$$;

revoke all on function public.normalize_user_timezone(text)
from public, anon, authenticated;

create or replace function public.set_valid_app_user_timezone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.timezone := public.normalize_user_timezone(new.timezone);
  return new;
end;
$$;

revoke all on function public.set_valid_app_user_timezone()
from public, anon, authenticated;

drop trigger if exists set_valid_app_user_timezone on public.app_users;
create trigger set_valid_app_user_timezone
before insert or update of timezone on public.app_users
for each row
execute function public.set_valid_app_user_timezone();

create or replace function public.create_tickist_app_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.app_users (auth_user_id, username, timezone)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      new.id::text
    ),
    public.normalize_user_timezone(new.raw_user_meta_data ->> 'timezone')
  )
  on conflict (auth_user_id) do update
  set timezone = excluded.timezone,
      updated_at = now();

  return new;
end;
$$;

revoke all on function public.create_tickist_app_user()
from public, anon, authenticated;

drop trigger if exists create_tickist_app_user on auth.users;
create trigger create_tickist_app_user
after insert on auth.users
for each row
execute function public.create_tickist_app_user();
