create table public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  stable_id uuid not null default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  kind text check (kind in ('work', 'private') or kind is null),
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);

create unique index workspaces_owner_name_idx on public.workspaces (owner_id, lower(btrim(name)));
create unique index workspaces_owner_stable_idx on public.workspaces (owner_id, stable_id);
create unique index workspaces_owner_kind_idx on public.workspaces (owner_id, kind) where kind is not null;

create function public.create_default_workspaces(user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspaces (owner_id, name, kind)
  values (user_id, 'Work', 'work'), (user_id, 'Private', 'private')
  on conflict do nothing;
end;
$$;

revoke all on function public.create_default_workspaces(uuid) from public, anon, authenticated;

create function public.create_default_workspaces_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_default_workspaces(new.id);
  return new;
end;
$$;

create trigger create_default_workspaces_after_signup
after insert on auth.users
for each row execute function public.create_default_workspaces_for_user();

select public.create_default_workspaces(id) from auth.users;

alter table public.workspaces enable row level security;
create policy workspaces_select_own on public.workspaces for select to authenticated
  using (owner_id = auth.uid());
create policy workspaces_insert_custom on public.workspaces for insert to authenticated
  with check (owner_id = auth.uid() and kind is null);
create policy workspaces_update_own on public.workspaces for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create function public.prevent_workspace_identity_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.owner_id is distinct from old.owner_id or new.kind is distinct from old.kind then
    raise exception 'Workspace identity cannot be changed';
  end if;
  new.name := btrim(new.name);
  return new;
end;
$$;
create trigger prevent_workspace_identity_change_before_update
before update on public.workspaces for each row
execute function public.prevent_workspace_identity_change();

alter table public.projects add column workspace_id uuid;
update public.projects p set workspace_id = w.id
from public.workspaces w
where w.owner_id = p.owner_id and w.kind = 'private' and not p.is_inbox;
alter table public.projects add constraint projects_workspace_owner_fk
  foreign key (workspace_id, owner_id) references public.workspaces (id, owner_id) on delete cascade;
alter table public.projects add constraint projects_workspace_required_check
  check ((is_inbox and workspace_id is null) or (not is_inbox and workspace_id is not null));
create index projects_workspace_idx on public.projects (owner_id, workspace_id);

create function public.assign_project_workspace()
returns trigger language plpgsql security definer set search_path = public as $$
declare parent_workspace uuid;
begin
  if new.is_inbox then
    new.workspace_id := null;
    new.ancestor_id := null;
  elsif new.ancestor_id is not null then
    select workspace_id into parent_workspace from public.projects
      where id = new.ancestor_id and owner_id = new.owner_id and not is_inbox;
    if parent_workspace is null then
      raise exception 'Parent project must belong to the same owner';
    end if;
    new.workspace_id := parent_workspace;
  elsif new.workspace_id is null then
    perform public.create_default_workspaces(new.owner_id);
    select id into new.workspace_id from public.workspaces
      where owner_id = new.owner_id and kind = 'private';
  end if;
  return new;
end;
$$;
create trigger assign_project_workspace_before_write
before insert or update of workspace_id, ancestor_id, is_inbox on public.projects
for each row execute function public.assign_project_workspace();

create function public.move_project_descendants()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.workspace_id is distinct from old.workspace_id then
    with recursive descendants as (
      select id from public.projects where ancestor_id = new.id
      union all
      select p.id from public.projects p join descendants d on p.ancestor_id = d.id
    )
    update public.projects set workspace_id = new.workspace_id
      where id in (select id from descendants) and workspace_id is distinct from new.workspace_id;
  end if;
  return null;
end;
$$;
create trigger move_project_descendants_after_update
after update of workspace_id on public.projects
for each row execute function public.move_project_descendants();

create table public.member_project_workspaces (
  project_id uuid not null,
  user_id uuid not null,
  workspace_id uuid not null,
  primary key (project_id, user_id),
  foreign key (project_id, user_id) references public.project_members (project_id, user_id) on delete cascade,
  foreign key (workspace_id, user_id) references public.workspaces (id, owner_id) on delete cascade
);
create index member_project_workspaces_user_idx on public.member_project_workspaces (user_id, workspace_id);
alter table public.member_project_workspaces enable row level security;
create policy member_project_workspaces_select_own on public.member_project_workspaces
  for select to authenticated using (user_id = auth.uid());
create policy member_project_workspaces_insert_own on public.member_project_workspaces
  for insert to authenticated with check (
    user_id = auth.uid() and exists (
      select 1 from public.project_members pm
      where pm.project_id = project_id and pm.user_id = auth.uid() and pm.status = 'accepted'
    )
  );
create policy member_project_workspaces_update_own on public.member_project_workspaces
  for update to authenticated using (user_id = auth.uid())
  with check (
    user_id = auth.uid() and exists (
      select 1 from public.project_members pm
      where pm.project_id = project_id and pm.user_id = auth.uid() and pm.status = 'accepted'
    )
  );
create policy member_project_workspaces_delete_own on public.member_project_workspaces
  for delete to authenticated using (user_id = auth.uid());

create or replace function public.get_statistics_overview_v2(window_days integer default 30, workspace_id uuid default null)
returns jsonb
language sql
stable
set search_path = public
as $$
with params as (
  select
    greatest(1, least(coalesce(window_days, 30), 3650))::integer as window_days,
    now() as reference_now,
    auth.uid() as user_id,
    workspace_id as selected_workspace_id
),
summary as (
  select
    count(*) filter (
      where t.when_complete is not null
        and t.when_complete >= p.reference_now - make_interval(days => p.window_days)
    )::integer as completed_count,
    count(*) filter (
      where t.when_complete is not null
        and t.when_complete >= p.reference_now - make_interval(days => p.window_days)
        and t.finish_date is not null
        and t.when_complete > t.finish_date
    )::integer as completed_late_count,
    count(*) filter (
      where t.is_done = false
        and t.finish_date is not null
        and t.finish_date < p.reference_now
    )::integer as open_overdue_count
  from params p
  left join public.tasks t
    on t.owner_id = p.user_id
   and (
     p.selected_workspace_id is null or t.project_id is null or exists (
       select 1 from public.projects tp
       where tp.id = t.project_id
         and (tp.is_inbox or tp.workspace_id = p.selected_workspace_id)
     )
   )
),
project_activity as (
  select
    pr.id as project_id,
    pr.name,
    coalesce(pr.color, '#394264') as color,
    coalesce(pr.icon, 'folder') as icon,
    case
      when lower(coalesce(pr.project_type, 'active')) in ('someday', 'maybe') then 'someday'
      when lower(coalesce(pr.project_type, 'active')) = 'routine' then 'routine'
      else 'active'
    end as group_key,
    greatest(
      pr.updated_at,
      coalesce(max(t.creation_date), '-infinity'::timestamptz),
      coalesce(max(t.modification_date), '-infinity'::timestamptz),
      coalesce(max(t.when_complete), '-infinity'::timestamptz)
    ) as last_activity_at,
    count(*) filter (where t.id is not null and t.is_done = false)::integer as open_tasks,
    count(*) filter (
      where t.id is not null
        and t.is_done = false
        and t.finish_date is not null
        and t.finish_date < (select reference_now from params)
    )::integer as overdue_open_tasks
  from public.projects pr
  join params p
    on pr.owner_id = p.user_id
  left join public.tasks t
    on t.project_id = pr.id
   and t.owner_id = p.user_id
  where pr.is_inbox = false
    and (p.selected_workspace_id is null or pr.workspace_id = p.selected_workspace_id)
  group by
    pr.id,
    pr.name,
    pr.color,
    pr.icon,
    pr.project_type,
    pr.updated_at
),
inactive_projects as (
  select
    pa.project_id,
    pa.name,
    pa.color,
    pa.icon,
    pa.group_key,
    pa.last_activity_at,
    greatest(
      0,
      floor(extract(epoch from (p.reference_now - pa.last_activity_at)) / 86400.0)
    )::integer as stale_days,
    pa.open_tasks,
    pa.overdue_open_tasks
  from project_activity pa
  cross join params p
  where pa.last_activity_at < p.reference_now - make_interval(days => p.window_days)
),
group_defs as (
  select *
  from (
    values
      ('active'::text, 'Active'::text, 1),
      ('someday'::text, 'Someday / Maybe'::text, 2),
      ('routine'::text, 'Routine'::text, 3)
  ) as defs(group_key, group_label, sort_order)
),
group_payloads as (
  select
    gd.group_key,
    gd.group_label,
    gd.sort_order,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'projectId', ip.project_id,
          'name', ip.name,
          'color', ip.color,
          'icon', ip.icon,
          'projectType', ip.group_key,
          'staleDays', ip.stale_days,
          'lastActivityAt', ip.last_activity_at,
          'openTasks', ip.open_tasks,
          'overdueOpenTasks', ip.overdue_open_tasks
        )
        order by ip.stale_days desc, ip.name asc
      ) filter (where ip.project_id is not null),
      '[]'::jsonb
    ) as inactive_projects
  from group_defs gd
  left join inactive_projects ip
    on ip.group_key = gd.group_key
  group by gd.group_key, gd.group_label, gd.sort_order
)
select jsonb_build_object(
  'windowDays', (select window_days from params),
  'summary', jsonb_build_object(
    'completedCount', (select completed_count from summary),
    'completedLateCount', (select completed_late_count from summary),
    'openOverdueCount', (select open_overdue_count from summary),
    'inactiveProjectsCount', (select count(*)::integer from inactive_projects)
  ),
  'groups', (
    select jsonb_agg(
      jsonb_build_object(
        'key', gp.group_key,
        'label', gp.group_label,
        'inactiveProjects', gp.inactive_projects
      )
      order by gp.sort_order
    )
    from group_payloads gp
  )
);
$$;

revoke all on function public.get_statistics_overview_v2(integer, uuid) from public, anon;
grant execute on function public.get_statistics_overview_v2(integer, uuid) to authenticated, service_role;

grant select, insert, update on public.workspaces to authenticated;
grant select, insert, update, delete on public.member_project_workspaces to authenticated;
grant all privileges on public.workspaces, public.member_project_workspaces to service_role;
