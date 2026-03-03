-- Fix INSERT ... RETURNING on projects under RLS.
-- Using can_access_project(id) in the SELECT policy can fail for freshly inserted
-- rows during the same statement snapshot. Check owner_id directly first.

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
    )
  );
