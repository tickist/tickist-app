-- Keep administrator membership in an operator-managed profile flag. Browser
-- roles may read their own flag, but cannot create, update or delete profiles.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false
);

alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;

create policy profiles_read_self on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));

create function public.create_admin_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_admin_profile() from public, anon, authenticated;

create trigger create_admin_profile
after insert on auth.users
for each row execute function public.create_admin_profile();

-- Install the trigger before backfilling, so signups cannot fall between the
-- snapshot of existing users and creation of future rows.
insert into public.profiles (user_id, is_admin)
select users.id, administrators.user_id is not null
from auth.users as users
left join public.app_administrators as administrators
  on administrators.user_id = users.id
on conflict (user_id) do update set is_admin = excluded.is_admin;

-- All existing RLS policies and the overview RPC continue to call this
-- function, so changing the flag updates the database authorization boundary.
create or replace function public.is_app_administrator()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and is_admin
  );
$$;
