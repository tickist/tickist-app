-- Day-0 hardening:
-- 1) ensure each owner has at most one inbox project
-- 2) enable RLS and add ownership/membership policies

-- Keep one inbox per owner (prefer app_users.inbox_project_id when present).
with ranked_inboxes as (
  select
    p.id,
    p.owner_id,
    row_number() over (
      partition by p.owner_id
      order by
        case when au.inbox_project_id = p.id then 0 else 1 end,
        p.created_at asc,
        p.id asc
    ) as rn
  from public.projects p
  left join public.app_users au on au.auth_user_id = p.owner_id
  where p.is_inbox = true
)
update public.projects p
set
  is_inbox = false,
  project_type = case
    when lower(coalesce(p.project_type, '')) = 'inbox' then 'active'
    else p.project_type
  end,
  updated_at = now()
from ranked_inboxes r
where p.id = r.id
  and r.rn > 1;

-- Align app_users.inbox_project_id with the surviving inbox project.
with chosen_inbox as (
  select distinct on (p.owner_id)
    p.owner_id,
    p.id as inbox_id
  from public.projects p
  left join public.app_users au on au.auth_user_id = p.owner_id
  where p.is_inbox = true
  order by
    p.owner_id,
    case when au.inbox_project_id = p.id then 0 else 1 end,
    p.created_at asc,
    p.id asc
)
update public.app_users au
set
  inbox_project_id = ci.inbox_id,
  updated_at = now()
from chosen_inbox ci
where au.auth_user_id = ci.owner_id
  and au.inbox_project_id is distinct from ci.inbox_id;

-- Enforce one inbox per owner going forward.
create unique index if not exists projects_owner_single_inbox_idx
  on public.projects (owner_id)
  where is_inbox = true;

-- Helper functions used by RLS policies.
create or replace function public.is_project_owner(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = project_uuid
      and p.owner_id = auth.uid()
  );
$$;

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

-- Enable RLS.
alter table public.app_users enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tags enable row level security;
alter table public.tasks enable row level security;
alter table public.task_steps enable row level security;
alter table public.task_tags enable row level security;
alter table public.notifications enable row level security;
alter table public.routine_reminders enable row level security;
alter table public.activity_logs enable row level security;

-- app_users
drop policy if exists app_users_select_own on public.app_users;
create policy app_users_select_own
  on public.app_users
  for select
  to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists app_users_insert_own on public.app_users;
create policy app_users_insert_own
  on public.app_users
  for insert
  to authenticated
  with check (auth_user_id = auth.uid());

drop policy if exists app_users_update_own on public.app_users;
create policy app_users_update_own
  on public.app_users
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- projects
drop policy if exists projects_select_access on public.projects;
create policy projects_select_access
  on public.projects
  for select
  to authenticated
  using (public.can_access_project(id));

drop policy if exists projects_insert_owner on public.projects;
create policy projects_insert_owner
  on public.projects
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists projects_update_owner on public.projects;
create policy projects_update_owner
  on public.projects
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists projects_delete_owner on public.projects;
create policy projects_delete_owner
  on public.projects
  for delete
  to authenticated
  using (owner_id = auth.uid());

-- project_members
drop policy if exists project_members_select_access on public.project_members;
create policy project_members_select_access
  on public.project_members
  for select
  to authenticated
  using (public.can_access_project(project_id));

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
  using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

drop policy if exists project_members_delete_owner on public.project_members;
create policy project_members_delete_owner
  on public.project_members
  for delete
  to authenticated
  using (public.is_project_owner(project_id));

-- tags
drop policy if exists tags_select_owner on public.tags;
create policy tags_select_owner
  on public.tags
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists tags_insert_owner on public.tags;
create policy tags_insert_owner
  on public.tags
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists tags_update_owner on public.tags;
create policy tags_update_owner
  on public.tags
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists tags_delete_owner on public.tags;
create policy tags_delete_owner
  on public.tags
  for delete
  to authenticated
  using (owner_id = auth.uid());

-- tasks
drop policy if exists tasks_select_access on public.tasks;
create policy tasks_select_access
  on public.tasks
  for select
  to authenticated
  using (
    owner_id = auth.uid()
    or (project_id is not null and public.can_access_project(project_id))
  );

drop policy if exists tasks_insert_owner on public.tasks;
create policy tasks_insert_owner
  on public.tasks
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and (project_id is null or public.can_access_project(project_id))
  );

drop policy if exists tasks_update_owner on public.tasks;
create policy tasks_update_owner
  on public.tasks
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists tasks_delete_owner on public.tasks;
create policy tasks_delete_owner
  on public.tasks
  for delete
  to authenticated
  using (owner_id = auth.uid());

-- task_steps
drop policy if exists task_steps_select_access on public.task_steps;
create policy task_steps_select_access
  on public.task_steps
  for select
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
  );

drop policy if exists task_steps_mutate_owner on public.task_steps;
create policy task_steps_mutate_owner
  on public.task_steps
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.tasks t
      where t.id = task_steps.task_id
        and t.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.tasks t
      where t.id = task_steps.task_id
        and t.owner_id = auth.uid()
    )
  );

-- task_tags
drop policy if exists task_tags_select_access on public.task_tags;
create policy task_tags_select_access
  on public.task_tags
  for select
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
  );

drop policy if exists task_tags_mutate_owner on public.task_tags;
create policy task_tags_mutate_owner
  on public.task_tags
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.tasks t
      where t.id = task_tags.task_id
        and t.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.tasks t
      where t.id = task_tags.task_id
        and t.owner_id = auth.uid()
    )
  );

-- notifications
drop policy if exists notifications_select_recipient on public.notifications;
create policy notifications_select_recipient
  on public.notifications
  for select
  to authenticated
  using (recipient_id = auth.uid());

drop policy if exists notifications_update_recipient on public.notifications;
create policy notifications_update_recipient
  on public.notifications
  for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

drop policy if exists notifications_delete_recipient on public.notifications;
create policy notifications_delete_recipient
  on public.notifications
  for delete
  to authenticated
  using (recipient_id = auth.uid());

-- routine_reminders
drop policy if exists routine_reminders_select_owner on public.routine_reminders;
create policy routine_reminders_select_owner
  on public.routine_reminders
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists routine_reminders_insert_owner on public.routine_reminders;
create policy routine_reminders_insert_owner
  on public.routine_reminders
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists routine_reminders_update_owner on public.routine_reminders;
create policy routine_reminders_update_owner
  on public.routine_reminders
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists routine_reminders_delete_owner on public.routine_reminders;
create policy routine_reminders_delete_owner
  on public.routine_reminders
  for delete
  to authenticated
  using (owner_id = auth.uid());

-- activity_logs
drop policy if exists activity_logs_select_actor on public.activity_logs;
create policy activity_logs_select_actor
  on public.activity_logs
  for select
  to authenticated
  using (actor_id = auth.uid());

drop policy if exists activity_logs_insert_actor on public.activity_logs;
create policy activity_logs_insert_actor
  on public.activity_logs
  for insert
  to authenticated
  with check (actor_id = auth.uid());
