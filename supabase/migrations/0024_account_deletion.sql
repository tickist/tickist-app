-- Operator-only deletion inspection and transactional cleanup for Auth hard deletion.
-- Storage bytes must be removed through the Storage API before deleting Auth.
create function public.account_deletion_preview(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_email text;
  blockers text[] := '{}';
  files jsonb;
begin
  select email into account_email from auth.users where id = p_user_id;
  if not found then
    raise exception 'Account not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.projects p
    join public.project_members m on m.project_id = p.id
    where p.owner_id = p_user_id and m.user_id <> p_user_id
  ) or exists (
    select 1 from public.tasks t join public.projects p on p.id = t.project_id
    where (p.owner_id = p_user_id and t.owner_id <> p_user_id)
       or (t.owner_id = p_user_id and p.owner_id <> p_user_id)
  ) or exists (
    select 1 from public.task_assignees a join public.tasks t on t.id = a.task_id
    where t.owner_id = p_user_id and a.user_id <> p_user_id
  ) or exists (
    select 1 from public.projects child join public.projects parent on parent.id = child.ancestor_id
    where child.owner_id <> parent.owner_id
      and (child.owner_id = p_user_id or parent.owner_id = p_user_id)
  ) then
    blockers := array_append(blockers, 'shared_work_requires_review');
  end if;

  -- Legacy arbitrary payloads have no reliable account key. Never silently claim
  -- complete erasure when this store contains unclassified historical data.
  if exists (select 1 from public.migration_audit) then
    blockers := array_append(blockers, 'migration_audit_requires_review');
  end if;
  if exists (
    select 1 from public.email_outbox
    where status = 'sending'
      and (lower(to_email) = lower(account_email) or position(p_user_id::text in dedupe_key) > 0)
  ) then
    blockers := array_append(blockers, 'email_delivery_in_progress');
  end if;
  if exists (
    select 1 from storage.objects
    where (owner_id = p_user_id::text or owner = p_user_id)
      and (bucket_id <> 'avatars' or split_part(name, '/', 1) <> p_user_id::text)
  ) then
    blockers := array_append(blockers, 'unexpected_storage_requires_review');
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket_id, 'name', name) order by name), '[]'::jsonb)
    into files from storage.objects
    where bucket_id = 'avatars' and split_part(name, '/', 1) = p_user_id::text;

  return jsonb_build_object(
    'user_id', p_user_id,
    'blockers', to_jsonb(blockers),
    'storage', files,
    'counts', jsonb_build_object(
      'projects', (select count(*) from public.projects where owner_id = p_user_id),
      'tasks', (select count(*) from public.tasks where owner_id = p_user_id),
      'tags', (select count(*) from public.tags where owner_id = p_user_id),
      'memberships', (select count(*) from public.project_members where user_id = p_user_id),
      'emails', (select count(*) from public.email_outbox where lower(to_email) = lower(account_email) or position(p_user_id::text in dedupe_key) > 0),
      'activity', (select count(*) from public.activity_logs where actor_id = p_user_id),
      'avatars', jsonb_array_length(files)
    )
  );
end;
$$;
revoke all on function public.account_deletion_preview(uuid) from public, anon, authenticated;
grant execute on function public.account_deletion_preview(uuid) to service_role;

create function public.cleanup_deleted_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  preview jsonb;
begin
  -- Hold these locks until Auth's deletion transaction commits. Sharing and
  -- email claiming cannot race past the final check. Fail rather than wait forever.
  set local lock_timeout = '5s';
  lock table public.projects, public.project_members, public.tasks,
    public.task_assignees, public.email_outbox, public.migration_audit
    in share row exclusive mode;
  preview := public.account_deletion_preview(old.id);
  if jsonb_array_length(preview->'blockers') > 0 then
    raise exception 'Account deletion blocked: %', preview->'blockers';
  end if;
  if jsonb_array_length(preview->'storage') > 0 then
    raise exception 'Remove account avatars through the Storage API first';
  end if;

  delete from public.email_outbox
    where lower(to_email) = lower(old.email) or position(old.id::text in dedupe_key) > 0;
  delete from public.activity_logs
    where actor_id = old.id
      or (entity_type = 'task' and entity_id in (select id from public.tasks where owner_id = old.id))
      or (entity_type = 'project' and entity_id in (select id from public.projects where owner_id = old.id));
  -- Auth and application foreign keys perform the remaining cascades. No direct
  -- SQL writes to storage.objects: metadata deletion would leave physical files.
  return old;
end;
$$;
revoke all on function public.cleanup_deleted_account() from public, anon, authenticated;
create trigger cleanup_tickist_account_before_delete
before delete on auth.users
for each row execute function public.cleanup_deleted_account();

-- Keep direct Inbox deletion forbidden, but permit the cascade after its Auth
-- owner has actually been deleted. SECURITY DEFINER makes the existence check
-- independent of the caller's RLS visibility; no client-controlled bypass flag.
create or replace function public.prevent_inbox_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.is_inbox and exists (select 1 from auth.users where id = old.owner_id) then
    raise exception 'Inbox project cannot be deleted';
  end if;
  return old;
end;
$$;
revoke all on function public.prevent_inbox_delete() from public, anon, authenticated;

-- A JWT can outlive Auth deletion. Prevent it from recreating orphan avatars.
create function public.tickist_current_account_exists()
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from auth.users where id = auth.uid()); $$;
revoke all on function public.tickist_current_account_exists() from public, anon;
grant execute on function public.tickist_current_account_exists() to authenticated;
create policy avatars_require_existing_account on storage.objects
as restrictive for all to authenticated
using (bucket_id <> 'avatars' or public.tickist_current_account_exists())
with check (bucket_id <> 'avatars' or public.tickist_current_account_exists());
