-- Security hardening for tables exposed through PostgREST.
alter table public.task_assignees enable row level security;
alter table public.migration_audit enable row level security;

-- task_assignees
drop policy if exists task_assignees_select_access on public.task_assignees;
create policy task_assignees_select_access
  on public.task_assignees
  for select
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
  );

drop policy if exists task_assignees_mutate_owner on public.task_assignees;
create policy task_assignees_mutate_owner
  on public.task_assignees
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.tasks t
      where t.id = task_assignees.task_id
        and t.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.tasks t
      where t.id = task_assignees.task_id
        and t.owner_id = auth.uid()
    )
  );

-- migration_audit
-- Intentionally no policies: authenticated and anonymous API roles have no access.
