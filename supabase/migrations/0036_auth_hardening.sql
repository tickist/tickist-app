-- Auth hardening from the security review.
-- 1. User metadata is writable through sign-up and PUT /auth/v1/user without a
--    size limit; cap it in the database.
-- 2. Supabase Auth keeps the first password when an unconfirmed address signs up
--    again and only resends the confirmation. A repeat sign-up (or resend) for an
--    account older than two minutes therefore clears the stored password, so the
--    mailbox owner claims the account through password recovery and nobody can
--    sign in with a password chosen before that.
-- 3. Usernames copied from metadata are clamped to the 80 characters the
--    settings form allows and stripped of control and bidirectional characters.
-- 4. Invitations only resolve confirmed accounts.

create or replace function public.clean_display_text(p_value text, p_max_length integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    btrim(
      left(
        regexp_replace(
          regexp_replace(coalesce(p_value, ''), '[[:cntrl:]]', ' ', 'g'),
          '[؜‎‏‪-‮⁦-⁩]',
          '',
          'g'
        ),
        p_max_length
      )
    ),
    ''
  );
$$;

revoke all on function public.clean_display_text(text, integer)
from public, anon, authenticated;
grant execute on function public.clean_display_text(text, integer)
to service_role;

create or replace function public.limit_auth_user_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if octet_length(coalesce(new.raw_user_meta_data, '{}'::jsonb)::text) > 16384 then
    raise exception 'User metadata is too large' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.limit_auth_user_metadata()
from public, anon, authenticated;

drop trigger if exists limit_auth_user_metadata on auth.users;
create trigger limit_auth_user_metadata
before insert or update of raw_user_meta_data on auth.users
for each row
execute function public.limit_auth_user_metadata();

create or replace function public.reset_repeat_signup_password()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.email_confirmed_at is null
     and new.email_confirmed_at is null
     and new.confirmation_sent_at is distinct from old.confirmation_sent_at
     and old.created_at < now() - interval '120 seconds' then
    -- An empty hash never matches, so nobody can sign in with a password chosen
    -- before the mailbox owner finishes recovery.
    new.encrypted_password := '';
  end if;

  return new;
end;
$$;

revoke all on function public.reset_repeat_signup_password()
from public, anon, authenticated;

drop trigger if exists reset_repeat_signup_password on auth.users;
create trigger reset_repeat_signup_password
before update of confirmation_sent_at on auth.users
for each row
execute function public.reset_repeat_signup_password();

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
      public.clean_display_text(new.raw_user_meta_data ->> 'full_name', 80),
      public.clean_display_text(new.raw_user_meta_data ->> 'name', 80),
      public.clean_display_text(split_part(coalesce(new.email, ''), '@', 1), 80),
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

update public.app_users
set username = coalesce(public.clean_display_text(username, 80), auth_user_id::text)
where char_length(username) > 80;

alter table public.app_users
drop constraint if exists app_users_username_length;
alter table public.app_users
add constraint app_users_username_length
check (char_length(username) <= 80);

create or replace function public.find_auth_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id
  from auth.users u
  where lower(u.email) = lower(btrim(p_email))
    and u.deleted_at is null
    and u.email_confirmed_at is not null
  order by u.created_at
  limit 1;
$$;

revoke all on function public.find_auth_user_id_by_email(text)
from public, anon, authenticated;
grant execute on function public.find_auth_user_id_by_email(text)
to service_role;
