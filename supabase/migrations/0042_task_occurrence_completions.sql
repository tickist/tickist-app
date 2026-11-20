-- Completed occurrences of recurring tasks.
--
-- Completing a recurring task keeps the same row open and moves its date to
-- the next occurrence, so tasks.when_complete never records it. Each completed
-- occurrence is stored here instead, for "Done today", statistics and the
-- email summaries. The task's cached spent_minutes then counts only the time
-- since its latest completed occurrence; each completion keeps the time spent
-- on the occurrence it closed. Time entries and time reports are unchanged.

create table if not exists public.task_occurrence_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  due_date timestamptz null,
  spent_minutes integer null,
  constraint task_occurrence_completions_due_date_finite
    check (due_date is null or isfinite(due_date)),
  constraint task_occurrence_completions_spent_nonnegative
    check (spent_minutes is null or spent_minutes >= 0)
);

comment on table public.task_occurrence_completions is
  'One completed occurrence of a recurring task: who completed it, when, its due date and the time spent on it.';

create index if not exists task_occurrence_completions_task_idx
  on public.task_occurrence_completions (task_id, completed_at desc);

create index if not exists task_occurrence_completions_owner_idx
  on public.task_occurrence_completions (owner_id, completed_at desc);

-- The database clock dates the completion, and the time spent on the closed
-- occurrence is every person's time on the task since the previous completion
-- (legacy minutes count towards the first one). A running timer counts up to
-- now, at most 24 hours, like the time report.
create or replace function public.prepare_task_occurrence_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous timestamptz;
  v_seconds numeric;
  v_legacy integer;
begin
  new.completed_at := now();
  new.owner_id := coalesce(new.owner_id, auth.uid());

  -- One completion at a time per task, so "previous" stays well defined.
  perform 1 from public.tasks t where t.id = new.task_id for update;

  select max(c.completed_at) into v_previous
  from public.task_occurrence_completions c
  where c.task_id = new.task_id;

  select sum(extract(epoch from (
      least(
        coalesce(e.ended_at, e.started_at + interval '24 hours'),
        new.completed_at
      ) - e.started_at
    )))
  into v_seconds
  from public.task_time_entries e
  where e.task_id = new.task_id
    and e.started_at < new.completed_at
    and (v_previous is null or e.started_at >= v_previous);

  if v_previous is null then
    select t.spent_minutes_legacy into v_legacy
    from public.tasks t
    where t.id = new.task_id;
  end if;

  new.spent_minutes := case
    when v_seconds is null and v_legacy is null then null
    else coalesce(v_legacy, 0) + coalesce(round(greatest(v_seconds, 0) / 60.0)::integer, 0)
  end;

  return new;
end;
$$;

revoke all on function public.prepare_task_occurrence_completion() from public, anon, authenticated;

drop trigger if exists prepare_task_occurrence_completion on public.task_occurrence_completions;
create trigger prepare_task_occurrence_completion
before insert on public.task_occurrence_completions
for each row
execute function public.prepare_task_occurrence_completion();

-- Cached task total. After a completed occurrence it counts the closed
-- entries started since the latest completion; otherwise legacy minutes plus
-- every closed entry, as before.
create or replace function public.recompute_task_spent_minutes(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_last_completed timestamptz;
begin
  perform set_config('tickist.spent_recompute', 'on', true);

  select max(c.completed_at) into v_last_completed
  from public.task_occurrence_completions c
  where c.task_id = p_task_id;

  update public.tasks t
  set spent_minutes = case
    when v_last_completed is not null then
      case when totals.seconds is null then null
      else round(totals.seconds / 60.0)::integer end
    when t.spent_minutes_legacy is null and totals.seconds is null then null
    else coalesce(t.spent_minutes_legacy, 0) + coalesce(round(totals.seconds / 60.0)::integer, 0)
  end
  from (
    select sum(extract(epoch from (e.ended_at - e.started_at))) as seconds
    from public.task_time_entries e
    where e.task_id = p_task_id
      and e.ended_at is not null
      and (v_last_completed is null or e.started_at >= v_last_completed)
  ) as totals
  where t.id = p_task_id;

  perform set_config('tickist.spent_recompute', 'off', true);
end;
$$;

revoke all on function public.recompute_task_spent_minutes(uuid) from public, anon, authenticated;

create or replace function public.task_occurrence_completions_recompute()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.recompute_task_spent_minutes(
    case when tg_op = 'DELETE' then old.task_id else new.task_id end
  );

  return null;
end;
$$;

revoke all on function public.task_occurrence_completions_recompute() from public, anon, authenticated;

drop trigger if exists task_occurrence_completions_recompute on public.task_occurrence_completions;
create trigger task_occurrence_completions_recompute
after insert or delete on public.task_occurrence_completions
for each row
execute function public.task_occurrence_completions_recompute();

alter table public.task_occurrence_completions enable row level security;

-- Visible to whoever completed it and to everyone who can see the task.
drop policy if exists task_occurrence_completions_select on public.task_occurrence_completions;
create policy task_occurrence_completions_select
  on public.task_occurrence_completions
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.tasks t
      where t.id = task_id
        and (
          t.owner_id = (select auth.uid())
          or (t.project_id is not null and public.can_access_project(t.project_id))
        )
    )
  );

-- Recorded by the person completing an accessible recurring task.
drop policy if exists task_occurrence_completions_insert_own on public.task_occurrence_completions;
create policy task_occurrence_completions_insert_own
  on public.task_occurrence_completions
  for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.tasks t
      where t.id = task_id
        and t.repeat_interval > 0
        and (
          t.owner_id = (select auth.uid())
          or (t.project_id is not null and public.can_access_project(t.project_id))
        )
    )
  );

revoke all on public.task_occurrence_completions from public, anon, authenticated;
grant select on public.task_occurrence_completions to authenticated;
grant insert (task_id, due_date) on public.task_occurrence_completions to authenticated;
grant all on public.task_occurrence_completions to service_role;

-- Statistics count completed occurrences of recurring tasks as completions.
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
occurrences as (
  select
    c.completed_at,
    c.due_date,
    t.project_id
  from params p
  join public.task_occurrence_completions c
    on c.owner_id = p.user_id
   and c.completed_at >= p.reference_now - make_interval(days => p.window_days)
  join public.tasks t
    on t.id = c.task_id
   and t.owner_id = p.user_id
  where p.selected_workspace_id is null or t.project_id is null or exists (
    select 1 from public.projects tp
    where tp.id = t.project_id
      and (tp.is_inbox or tp.workspace_id = p.selected_workspace_id)
  )
),
summary as (
  select
    count(*) filter (
      where t.when_complete is not null
        and t.when_complete >= p.reference_now - make_interval(days => p.window_days)
    )::integer
      + (select count(*) from occurrences)::integer as completed_count,
    count(*) filter (
      where t.when_complete is not null
        and t.when_complete >= p.reference_now - make_interval(days => p.window_days)
        and t.finish_date is not null
        and t.when_complete > t.finish_date
    )::integer
      + (
        select count(*) from occurrences o
        where o.due_date is not null and o.completed_at > o.due_date
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
      coalesce(max(t.when_complete), '-infinity'::timestamptz),
      coalesce(
        (select max(o.completed_at) from occurrences o where o.project_id = pr.id),
        '-infinity'::timestamptz
      )
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
