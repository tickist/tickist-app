alter table public.project_members
  add column if not exists status text not null default 'accepted',
  add column if not exists invited_by uuid references auth.users(id) on delete set null,
  add column if not exists invited_email text,
  add column if not exists invited_project_name text,
  add column if not exists accepted_at timestamptz,
  add column if not exists declined_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_members_status_check'
      and conrelid = 'public.project_members'::regclass
  ) then
    alter table public.project_members
      add constraint project_members_status_check
      check (status in ('pending', 'accepted', 'declined'));
  end if;
end $$;

update public.project_members
set status = 'accepted',
    accepted_at = coalesce(accepted_at, invited_at, now()),
    updated_at = now()
where status is null
   or status = 'accepted';

create index if not exists project_members_user_status_idx
  on public.project_members (user_id, status);

create index if not exists project_members_project_status_idx
  on public.project_members (project_id, status);

drop trigger if exists set_project_members_updated_at on public.project_members;
create trigger set_project_members_updated_at
before update on public.project_members
for each row
execute function public.set_updated_at();

create or replace function public.is_project_member(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = project_uuid
      and pm.user_id = auth.uid()
      and pm.status = 'accepted'
  );
$$;

create or replace function public.can_access_project(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_project_owner(project_uuid)
      or public.is_project_member(project_uuid);
$$;

drop policy if exists projects_select_access on public.projects;
create policy projects_select_access
  on public.projects
  for select
  to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1
      from public.project_members pm
      where pm.project_id = id
        and pm.user_id = auth.uid()
        and pm.status = 'accepted'
    )
  );

drop policy if exists project_members_select_access on public.project_members;
create policy project_members_select_access
  on public.project_members
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_project_owner(project_id)
    or public.can_access_project(project_id)
  );

drop policy if exists project_members_insert_owner on public.project_members;
create policy project_members_insert_owner
  on public.project_members
  for insert
  to authenticated
  with check (public.is_project_owner(project_id));

drop policy if exists project_members_update_owner on public.project_members;
create policy project_members_update_owner
  on public.project_members
  for update
  to authenticated
  using (
    public.is_project_owner(project_id)
    or (user_id = auth.uid() and status = 'pending')
    or (user_id = auth.uid() and status = 'accepted')
  )
  with check (
    public.is_project_owner(project_id)
    or user_id = auth.uid()
  );

drop policy if exists project_members_delete_owner on public.project_members;
create policy project_members_delete_owner
  on public.project_members
  for delete
  to authenticated
  using (
    public.is_project_owner(project_id)
    or (user_id = auth.uid() and status = 'accepted')
  );

drop policy if exists tasks_update_owner on public.tasks;
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
    owner_id = auth.uid()
    or (project_id is not null and public.can_access_project(project_id))
  );

drop policy if exists tasks_delete_owner on public.tasks;
drop policy if exists tasks_delete_collaborator on public.tasks;
create policy tasks_delete_collaborator
  on public.tasks
  for delete
  to authenticated
  using (
    owner_id = auth.uid()
    or (project_id is not null and public.can_access_project(project_id))
  );

drop policy if exists task_steps_mutate_owner on public.task_steps;
drop policy if exists task_steps_mutate_collaborator on public.task_steps;
create policy task_steps_mutate_collaborator
  on public.task_steps
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.tasks t
      where t.id = task_steps.task_id
        and (
          t.owner_id = auth.uid()
          or (t.project_id is not null and public.can_access_project(t.project_id))
        )
    )
  )
  with check (
    exists (
      select 1
      from public.tasks t
      where t.id = task_steps.task_id
        and (
          t.owner_id = auth.uid()
          or (t.project_id is not null and public.can_access_project(t.project_id))
        )
    )
  );

drop policy if exists task_tags_mutate_owner on public.task_tags;
drop policy if exists task_tags_mutate_collaborator on public.task_tags;
create policy task_tags_mutate_collaborator
  on public.task_tags
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.tasks t
      where t.id = task_tags.task_id
        and (
          t.owner_id = auth.uid()
          or (t.project_id is not null and public.can_access_project(t.project_id))
        )
    )
  )
  with check (
    exists (
      select 1
      from public.tasks t
      where t.id = task_tags.task_id
        and (
          t.owner_id = auth.uid()
          or (t.project_id is not null and public.can_access_project(t.project_id))
        )
    )
  );

drop policy if exists task_assignees_mutate_owner on public.task_assignees;
drop policy if exists task_assignees_mutate_collaborator on public.task_assignees;
create policy task_assignees_mutate_collaborator
  on public.task_assignees
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.tasks t
      where t.id = task_assignees.task_id
        and (
          t.owner_id = auth.uid()
          or (t.project_id is not null and public.can_access_project(t.project_id))
        )
    )
  )
  with check (
    exists (
      select 1
      from public.tasks t
      where t.id = task_assignees.task_id
        and (
          t.owner_id = auth.uid()
          or (t.project_id is not null and public.can_access_project(t.project_id))
        )
    )
  );
