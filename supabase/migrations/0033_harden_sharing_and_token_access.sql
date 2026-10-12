-- Security hardening for shared projects, task ownership, notification abuse,
-- personal API tokens, MCP audit records, and avatar listing.
-- Server-side code (service role, no auth.uid()) keeps its existing powers.

-- ---------------------------------------------------------------------------
-- Shared project membership
-- ---------------------------------------------------------------------------

-- Users who already work together: one owns a project the other accepted, or
-- both are accepted members of the same project.
create or replace function public.is_existing_collaborator(other_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members pm
    join public.projects p on p.id = pm.project_id
    where pm.status = 'accepted'
      and (
        (p.owner_id = auth.uid() and pm.user_id = other_user)
        or (p.owner_id = other_user and pm.user_id = auth.uid())
      )
  )
  or exists (
    select 1
    from public.project_members mine
    join public.project_members theirs on theirs.project_id = mine.project_id
    where mine.user_id = auth.uid()
      and mine.status = 'accepted'
      and theirs.user_id = other_user
      and theirs.status = 'accepted'
  );
$$;

revoke all on function public.is_existing_collaborator(uuid)
from public, anon, authenticated;

-- Fires before enforce_invitation_lifetime (trigger names run alphabetically),
-- so an insert downgraded to a pending invitation still gets invitation fields.
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

  if tg_op = 'INSERT' then
    if new.user_id = actor then
      raise exception 'A project owner cannot add themselves as a member'
        using errcode = '42501';
    end if;
    -- Direct sharing without an invitation is limited to existing
    -- collaborators; everyone else must accept a pending invitation.
    if new.status = 'accepted'
       and not public.is_existing_collaborator(new.user_id) then
      new.status := 'pending';
      new.accepted_at := null;
    end if;
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

drop trigger if exists authorize_project_member_change on public.project_members;
create trigger authorize_project_member_change
before insert or update on public.project_members
for each row execute function public.authorize_project_member_change();

drop policy if exists project_members_insert_owner on public.project_members;
create policy project_members_insert_owner
  on public.project_members
  for insert
  to authenticated
  with check (
    public.is_project_owner(project_id)
    and user_id <> auth.uid()
  );

drop policy if exists project_members_update_owner on public.project_members;
create policy project_members_update_owner
  on public.project_members
  for update
  to authenticated
  using (
    public.is_project_owner(project_id)
    or (user_id = auth.uid() and status = 'pending')
  )
  with check (
    public.is_project_owner(project_id)
    or (user_id = auth.uid() and status in ('accepted', 'declined'))
  );

-- The previous check compared pm.project_id with itself.
drop policy if exists member_project_workspaces_insert_own
  on public.member_project_workspaces;
create policy member_project_workspaces_insert_own
  on public.member_project_workspaces
  for insert to authenticated with check (
    user_id = auth.uid() and exists (
      select 1 from public.project_members pm
      where pm.project_id = member_project_workspaces.project_id
        and pm.user_id = auth.uid()
        and pm.status = 'accepted'
    )
  );

drop policy if exists member_project_workspaces_update_own
  on public.member_project_workspaces;
create policy member_project_workspaces_update_own
  on public.member_project_workspaces
  for update to authenticated using (user_id = auth.uid())
  with check (
    user_id = auth.uid() and exists (
      select 1 from public.project_members pm
      where pm.project_id = member_project_workspaces.project_id
        and pm.user_id = auth.uid()
        and pm.status = 'accepted'
    )
  );

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------

create or replace function public.authorize_task_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    return new;
  end if;

  if new.owner_id is distinct from old.owner_id then
    raise exception 'Task ownership cannot be changed'
      using errcode = '42501';
  end if;

  -- Moving a task is reserved for its author or the source project's owner.
  if new.project_id is distinct from old.project_id
     and old.owner_id <> actor
     and not (
       old.project_id is not null
       and exists (
         select 1 from public.projects
         where id = old.project_id and owner_id = actor
       )
     ) then
    raise exception 'Only the task author or project owner can move a task'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.authorize_task_change()
from public, anon, authenticated;

drop trigger if exists authorize_task_change on public.tasks;
create trigger authorize_task_change
before update on public.tasks
for each row execute function public.authorize_task_change();

drop policy if exists tasks_update_collaborator on public.tasks;
create policy tasks_update_collaborator
  on public.tasks
  for update
  to authenticated
  using (
    owner_id = auth.uid()
    or (project_id is not null and public.can_access_project(project_id))
  )
  with check (
    (project_id is null and owner_id = auth.uid())
    or (project_id is not null and public.can_access_project(project_id))
  );

-- One resume email per task per day and at most 20 per recipient per day, so
-- toggling tasks cannot flood the shared outbox.
create or replace function public.notify_task_resumed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid := gen_random_uuid();
  recipient_email text;
  notification_description text;
  dedupe text := format('task_resumed:%s:%s', new.id, current_date);
begin
  if old.is_active = false
    and new.is_active = true
    and new.is_done = false then
    if exists (select 1 from public.email_outbox where dedupe_key = dedupe) then
      return new;
    end if;

    notification_description := format(
      'Task "%s" is active again.',
      left(new.name, 200)
    );

    insert into public.notifications (
      id,
      recipient_id,
      title,
      description,
      type,
      icon
    )
    values (
      notification_id,
      new.owner_id,
      'Task resumed',
      notification_description,
      'task-resumed',
      'play'
    );

    select lower(trim(u.email))
      into recipient_email
    from auth.users u
    where u.id = new.owner_id;

    if coalesce(recipient_email, '') <> ''
       and (
         select count(*)
         from public.email_outbox o
         where o.to_email = recipient_email
           and o.type = 'task_resumed'
           and o.created_at > now() - interval '1 day'
       ) < 20 then
      perform public.enqueue_email(
        recipient_email,
        format('Task resumed: %s', left(new.name, 120)),
        null,
        format(
          'Your task "%s" is active again in Tickist.',
          left(new.name, 200)
        ),
        'task_resumed',
        dedupe
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.notify_task_resumed()
from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Personal API tokens: created server-side only, never by MCP OAuth tokens.
-- ---------------------------------------------------------------------------

drop policy if exists api_tokens_insert_own on public.api_tokens;
revoke insert, update on table public.api_tokens from anon, authenticated;

create or replace function public.create_api_token(p_name text)
returns table (
  id uuid,
  name text,
  token_prefix text,
  scopes text[],
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz,
  raw_token text
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  claims jsonb := coalesce(auth.jwt(), '{}'::jsonb);
  token text;
  token_name text := left(nullif(btrim(coalesce(p_name, '')), ''), 100);
begin
  if actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  -- Delegated (OAuth/MCP) sessions must not mint long-lived credentials.
  if claims ? 'client_id' or coalesce((claims->>'tickist_mcp')::boolean, false) then
    raise exception 'API tokens can only be created from a Tickist session'
      using errcode = '42501';
  end if;
  if (select count(*) from public.api_tokens t where t.owner_id = actor) >= 20 then
    raise exception 'API token limit reached' using errcode = '54000';
  end if;

  token := 'tk_' || encode(extensions.gen_random_bytes(32), 'hex');

  return query
  insert into public.api_tokens as t (owner_id, name, token_hash, token_prefix)
  values (
    actor,
    coalesce(token_name, 'API Token'),
    encode(extensions.digest(token, 'sha256'), 'hex'),
    left(token, 8)
  )
  returning t.id, t.name, t.token_prefix, t.scopes, t.last_used_at,
    t.expires_at, t.created_at, token;
end;
$$;

revoke all on function public.create_api_token(text) from public, anon;
grant execute on function public.create_api_token(text) to authenticated;

-- ---------------------------------------------------------------------------
-- MCP audit trail: callers may only open a record and close it once.
-- ---------------------------------------------------------------------------

create or replace function public.protect_mcp_audit_event()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  token_client text := auth.jwt()->>'client_id';
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.outcome := 'started';
    new.error_code := null;
    new.finished_at := null;
    new.created_at := now();
    if token_client is not null then
      new.client_id := token_client;
    end if;
    return new;
  end if;

  if old.outcome <> 'started'
     or new.outcome not in ('succeeded', 'failed')
     or new.id is distinct from old.id
     or new.owner_id is distinct from old.owner_id
     or new.client_id is distinct from old.client_id
     or new.tool_name is distinct from old.tool_name
     or new.target_type is distinct from old.target_type
     or new.target_id is distinct from old.target_id
     or new.request_id is distinct from old.request_id
     or new.created_at is distinct from old.created_at then
    raise exception 'MCP audit records can only be completed once'
      using errcode = '42501';
  end if;
  new.finished_at := now();
  return new;
end;
$$;

revoke all on function public.protect_mcp_audit_event()
from public, anon, authenticated;

drop trigger if exists protect_mcp_audit_event on public.mcp_audit_events;
create trigger protect_mcp_audit_event
before insert or update on public.mcp_audit_events
for each row execute function public.protect_mcp_audit_event();

-- ---------------------------------------------------------------------------
-- Avatars: public URLs keep working without a bucket-wide listing policy.
-- Upserts still need SELECT on the caller's own folder.
-- ---------------------------------------------------------------------------

drop policy if exists avatars_public_read on storage.objects;
drop policy if exists avatars_select_own on storage.objects;
create policy avatars_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Invitation lookup for the project-invite Edge Function (service role only).
-- ---------------------------------------------------------------------------

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
  order by u.created_at
  limit 1;
$$;

revoke all on function public.find_auth_user_id_by_email(text)
from public, anon, authenticated;
grant execute on function public.find_auth_user_id_by_email(text)
to service_role;
