-- Only final, reviewed documents belong here. No draft is seeded by this migration.
create table public.legal_releases (
  version text primary key check (version ~ '^[A-Za-z0-9._-]{1,80}$'),
  locale text not null check (locale in ('en','pl')),
  terms_text text not null check (length(btrim(terms_text)) > 0),
  privacy_text text not null check (length(btrim(privacy_text)) > 0),
  published_at timestamptz not null,
  is_current boolean not null default false
);
create unique index legal_one_current_release on public.legal_releases(is_current) where is_current;
alter table public.legal_releases enable row level security;
revoke all on public.legal_releases from public, anon, authenticated;
grant select on public.legal_releases to anon, authenticated;
grant select, insert, update, delete on public.legal_releases to service_role;
create policy legal_public_releases on public.legal_releases for select to anon, authenticated
using (published_at <= now());
create policy legal_operator_releases on public.legal_releases for all to service_role
using (true) with check (true);

create function public.preserve_legal_release()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.published_at <= now() then
    if tg_op='DELETE' then raise exception 'Published legal documents must be retained'; end if;
    if (new.version,new.locale,new.terms_text,new.privacy_text,new.published_at)
       is distinct from (old.version,old.locale,old.terms_text,old.privacy_text,old.published_at) then
      raise exception 'Publish a new legal version instead of changing an existing document';
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.preserve_legal_release() from public, anon, authenticated;
create trigger preserve_legal_release before update or delete on public.legal_releases
for each row execute function public.preserve_legal_release();

create table public.legal_acceptances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version text not null references public.legal_releases(version),
  accepted_at timestamptz not null default now()
);
alter table public.legal_acceptances enable row level security;
revoke all on public.legal_acceptances from public, anon, authenticated;
grant select on public.legal_acceptances to authenticated, service_role;
create policy legal_acceptance_owner_read on public.legal_acceptances for select to authenticated
using (user_id=auth.uid());
create policy legal_acceptance_operator_read on public.legal_acceptances for select to service_role using (true);

create function public.capture_registration_terms()
returns trigger language plpgsql security definer set search_path = '' as $$
declare release_version text;
begin
  -- Preconfirmed users are provisioned by an operator; do not fabricate their consent.
  -- Ordinary production email signup requires confirmation and reaches this guard.
  if new.email is null or (new.email_confirmed_at is not null
     and new.raw_user_meta_data->>'legal_version' is null
     and new.raw_user_meta_data->>'terms_accepted' is null) then return new; end if;
  select version into release_version from public.legal_releases
    where is_current and published_at <= now() for share;
  if release_version is null then raise exception 'Registration is unavailable until legal documents are published'; end if;
  if new.raw_user_meta_data->>'terms_accepted' is distinct from 'true'
     or new.raw_user_meta_data->>'legal_version' is distinct from release_version then
    raise exception 'Accept the current Terms of Service before registration';
  end if;
  insert into public.legal_acceptances(user_id,version) values(new.id,release_version);
  return new;
end;
$$;
revoke all on function public.capture_registration_terms() from public, anon, authenticated;
create trigger capture_registration_terms after insert on auth.users
for each row execute function public.capture_registration_terms();
