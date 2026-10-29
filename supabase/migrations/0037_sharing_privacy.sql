-- Sharing privacy and connected-app limits from the security review.
-- 1. A project owner must not learn whether an invited email address has a
--    Tickist account or what its user id is. Every invitation, for a known or
--    unknown address, is recorded in project_invitations, which is what the
--    owner sees. Pending and declined project_members rows (with the invitee's
--    user id) are visible only to the invitee until they accept.
-- 2. Direct membership inserts are limited to existing collaborators instead of
--    silently becoming invitations, so guessing user ids reveals nothing.
-- 3. OAuth-client tokens (MCP connected apps) cannot create, accept or cancel
--    relationships between accounts.

create table public.project_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  invited_email text not null
    check (char_length(invited_email) between 3 and 254 and invited_email = lower(invited_email)),
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  unique (project_id, invited_email)
);

create index project_invitations_invited_at_idx
  on public.project_invitations(invited_at);

alter table public.project_invitations enable row level security;

revoke all on public.project_invitations from anon, authenticated;
grant select, delete on public.project_invitations to authenticated;
grant all on public.project_invitations to service_role;

create policy project_invitations_select_owner
  on public.project_invitations
  for select
  to authenticated
  using (public.is_project_owner(project_id));

create policy project_invitations_delete_owner
  on public.project_invitations
  for delete
  to authenticated
  using (
    public.is_project_owner(project_id)
    and coalesce(auth.jwt() ->> 'client_id', '') = ''
  );

-- Existing invitations stay visible to their owners in the new form.
insert into public.project_invitations (project_id, invited_email, invited_by, invited_at)
select distinct on (pm.project_id, lower(pm.invited_email))
  pm.project_id,
  lower(pm.invited_email),
  pm.invited_by,
  coalesce(pm.invited_at, now())
from public.project_members pm
where pm.status in ('pending', 'declined')
  and pm.invited_email is not null
  and char_length(pm.invited_email) between 3 and 254
order by pm.project_id, lower(pm.invited_email), pm.invited_at desc nulls last
on conflict (project_id, invited_email) do nothing;

-- Cancelling an invitation withdraws the hidden membership row as well.
create or replace function public.withdraw_cancelled_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.project_members
  where project_id = old.project_id
    and lower(invited_email) = old.invited_email
    and status in ('pending', 'declined');

  return old;
end;
$$;

revoke all on function public.withdraw_cancelled_invitation()
from public, anon, authenticated;

create trigger withdraw_cancelled_invitation
after delete on public.project_invitations
for each row
execute function public.withdraw_cancelled_invitation();

-- An accepted invitation becomes a visible member, so its record is done.
create or replace function public.complete_accepted_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'accepted'
     and old.status is distinct from 'accepted'
     and new.invited_email is not null then
    delete from public.project_invitations
    where project_id = new.project_id
      and invited_email = lower(new.invited_email);
  end if;

  return new;
end;
$$;

revoke all on function public.complete_accepted_invitation()
from public, anon, authenticated;

create trigger complete_accepted_invitation
after update of status on public.project_members
for each row
execute function public.complete_accepted_invitation();

drop policy if exists project_members_select_access on public.project_members;
create policy project_members_select_access
  on public.project_members
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      status = 'accepted'
      and (public.is_project_owner(project_id) or public.can_access_project(project_id))
    )
  );

drop policy if exists project_members_update_owner on public.project_members;
create policy project_members_update_owner
  on public.project_members
  for update
  to authenticated
  using (
    (public.is_project_owner(project_id) and status = 'accepted')
    or (user_id = auth.uid() and status = 'pending')
  )
  with check (
    (public.is_project_owner(project_id) and status = 'accepted')
    or (user_id = auth.uid() and status in ('accepted', 'declined'))
  );

create or replace function public.authorize_project_member_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_owns_project boolean;
begin
  if actor is null then
    return new;
  end if;

  if coalesce(auth.jwt() ->> 'client_id', '') <> '' then
    raise exception 'Not available to connected apps'
      using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    if new.user_id = actor then
      raise exception 'A project owner cannot add themselves as a member'
        using errcode = '42501';
    end if;
    -- Direct sharing is limited to existing collaborators; everyone else is
    -- invited by email through the project-invite function. The same error for
    -- unknown and unrelated user ids keeps account existence private.
    if not public.is_existing_collaborator(new.user_id) then
      raise exception 'Invite this person by email'
        using errcode = '42501';
    end if;
    new.status := 'accepted';
    new.accepted_at := coalesce(new.accepted_at, now());
    return new;
  end if;

  if new.project_id is distinct from old.project_id
     or new.user_id is distinct from old.user_id then
    raise exception 'A membership cannot be moved to another project or user'
      using errcode = '42501';
  end if;

  select exists (
    select 1 from public.projects
    where id = old.project_id and owner_id = actor
  ) into actor_owns_project;

  if new.status = 'accepted'
     and old.status is distinct from 'accepted'
     and new.user_id <> actor then
    raise exception 'Only the invited person can accept an invitation'
      using errcode = '42501';
  end if;

  if not actor_owns_project then
    if new.role is distinct from old.role
       or new.invited_via is distinct from old.invited_via then
      raise exception 'Only the project owner can change membership details'
        using errcode = '42501';
    end if;
    if new.status is distinct from old.status
       and not (old.status = 'pending' and new.status in ('accepted', 'declined')) then
      raise exception 'Invalid membership status change'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.authorize_project_member_change()
from public, anon, authenticated;

create or replace function public.purge_application_history()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  notifications_count bigint; invitations_count bigint; invitation_records_count bigint;
  mcp_count bigint; activity_count bigint;
begin
  set local lock_timeout = '5s';
  delete from public.notifications where created_at <= now() - interval '180 days';
  get diagnostics notifications_count = row_count;
  delete from public.project_members
    where (status = 'pending' and invited_at <= now() - interval '30 days')
       or (status = 'declined' and declined_at <= now() - interval '30 days');
  get diagnostics invitations_count = row_count;
  delete from public.project_invitations where invited_at <= now() - interval '30 days';
  get diagnostics invitation_records_count = row_count;
  delete from public.mcp_audit_events where created_at <= now() - interval '90 days';
  get diagnostics mcp_count = row_count;
  delete from public.activity_logs where created_at <= now() - interval '90 days';
  get diagnostics activity_count = row_count;
  return jsonb_build_object('notifications', notifications_count, 'invitations', invitations_count,
    'invitation_records', invitation_records_count,
    'mcp_audit_events', mcp_count, 'activity_logs', activity_count);
end;
$$;
revoke all on function public.purge_application_history() from public, anon, authenticated;
grant execute on function public.purge_application_history() to service_role;
