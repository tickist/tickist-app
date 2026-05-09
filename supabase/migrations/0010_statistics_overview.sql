create or replace function public.set_project_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_project_updated_at();

create or replace function public.set_task_activity_fields()
returns trigger
language plpgsql
as $$
begin
  new.modification_date = now();

  if old.is_done is distinct from new.is_done then
    if new.is_done then
      new.when_complete = now();
    else
      new.when_complete = null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists set_tasks_activity_fields on public.tasks;
create trigger set_tasks_activity_fields
before update on public.tasks
for each row
execute function public.set_task_activity_fields();

update public.tasks
set modification_date = coalesce(modification_date, creation_date, now())
where modification_date is null;

update public.tasks
set when_complete = modification_date
where is_done = true
  and when_complete is null;

create index if not exists tasks_owner_project_modification_idx
  on public.tasks (owner_id, project_id, modification_date desc);

create index if not exists tasks_owner_when_complete_idx
  on public.tasks (owner_id, when_complete desc)
  where when_complete is not null;

create index if not exists tasks_owner_finish_date_idx
  on public.tasks (owner_id, finish_date)
  where finish_date is not null;

create index if not exists projects_owner_type_inbox_idx
  on public.projects (owner_id, project_type, is_inbox);

create or replace function public.get_statistics_overview(window_days integer default 30)
returns jsonb
language sql
stable
set search_path = public
as $$
with params as (
  select
    greatest(1, least(coalesce(window_days, 30), 3650))::integer as window_days,
    now() as reference_now,
    auth.uid() as user_id
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

revoke all on function public.get_statistics_overview(integer) from public, anon;
grant execute on function public.get_statistics_overview(integer) to authenticated, service_role;
