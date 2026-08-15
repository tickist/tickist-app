create or replace function public.list_accessible_project_assignees()
returns table (
  project_id uuid,
  user_id uuid,
  label text
)
language sql
stable
security definer
set search_path = ''
as $$
  with accessible_projects as (
    select projects.id, projects.owner_id
    from public.projects
    where auth.uid() is not null
      and public.can_access_project(projects.id)
  ),
  project_users as (
    select accessible_projects.id as project_id,
           accessible_projects.owner_id as user_id
    from accessible_projects
    union
    select project_members.project_id,
           project_members.user_id
    from public.project_members
    join accessible_projects
      on accessible_projects.id = project_members.project_id
    where project_members.status = 'accepted'
  )
  select project_users.project_id,
         project_users.user_id,
         coalesce(
           nullif(btrim(auth_users.raw_user_meta_data ->> 'full_name'), ''),
           nullif(btrim(auth_users.raw_user_meta_data ->> 'name'), ''),
           nullif(btrim(app_users.username), ''),
           nullif(btrim(auth_users.email), ''),
           'Project member'
         ) as label
  from project_users
  join auth.users as auth_users
    on auth_users.id = project_users.user_id
  left join public.app_users
    on app_users.auth_user_id = project_users.user_id
  order by project_users.project_id, label, project_users.user_id;
$$;

revoke all on function public.list_accessible_project_assignees() from public;
revoke all on function public.list_accessible_project_assignees() from anon;
grant execute on function public.list_accessible_project_assignees() to authenticated;

comment on function public.list_accessible_project_assignees() is
  'Returns display labels only for owners and accepted members of projects visible to the current user.';
