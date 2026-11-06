-- Task time tracking: every stretch of work is a time entry with a start and an
-- end. Durations are computed when read. tasks.spent_minutes becomes a cached
-- total of undated legacy minutes plus closed entries, maintained here; browser
-- and MCP writes to it after insert are ignored.
-- A day is the calendar date of started_at in the account timezone.

create extension if not exists btree_gist with schema extensions;

-- Legacy minutes keep the hand-entered totals that have no date.
alter table public.tasks
add column if not exists spent_minutes_legacy integer null;

update public.tasks
set spent_minutes_legacy = spent_minutes
where spent_minutes is not null
  and spent_minutes_legacy is null;

alter table public.tasks
drop constraint if exists tasks_spent_minutes_legacy_nonnegative;
alter table public.tasks
add constraint tasks_spent_minutes_legacy_nonnegative
check (spent_minutes_legacy is null or spent_minutes_legacy >= 0) not valid;

-- Null means no focus limit.
alter table public.app_users
add column if not exists focus_limit_minutes smallint null default 50;

alter table public.app_users
drop constraint if exists app_users_focus_limit_minutes_range;
alter table public.app_users
add constraint app_users_focus_limit_minutes_range
check (focus_limit_minutes is null or focus_limit_minutes between 1 and 600);

create table if not exists public.task_time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz null,
  limit_minutes smallint null,
  source text not null default 'manual',
  note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_time_entries_source_check
    check (source in ('timer', 'manual')),
  constraint task_time_entries_started_at_finite
    check (isfinite(started_at)),
  constraint task_time_entries_ended_at_finite
    check (ended_at is null or isfinite(ended_at)),
  constraint task_time_entries_order
    check (ended_at is null or ended_at > started_at),
  constraint task_time_entries_max_length
    check (ended_at is null or ended_at <= started_at + interval '24 hours'),
  constraint task_time_entries_manual_closed
    check (source = 'timer' or ended_at is not null),
  constraint task_time_entries_limit_range
    check (limit_minutes is null or limit_minutes between 1 and 600),
  constraint task_time_entries_note_length
    check (note is null or char_length(note) <= 500),
  constraint task_time_entries_no_overlap
    exclude using gist (
      owner_id with =,
      tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz), '[)') with &&
    )
);

comment on table public.task_time_entries is
  'Work on a task by one person. ended_at null means the timer is running.';

create unique index if not exists task_time_entries_one_running_idx
  on public.task_time_entries (owner_id)
  where ended_at is null;

create index if not exists task_time_entries_owner_started_idx
  on public.task_time_entries (owner_id, started_at desc);

create index if not exists task_time_entries_task_idx
  on public.task_time_entries (task_id, started_at desc);

drop trigger if exists set_task_time_entries_updated_at on public.task_time_entries;
create trigger set_task_time_entries_updated_at
before update on public.task_time_entries
for each row
execute function public.set_updated_at();

-- Server-controlled fields: owner, source and limit are fixed after insert,
-- browser inserts are always manual, and entries cannot start in the future.
create or replace function public.guard_task_time_entry()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.started_at > now() + interval '1 minute' then
    raise exception 'Time entries cannot start in the future' using errcode = '22023';
  end if;

  if new.ended_at is not null and new.ended_at > now() + interval '1 minute' then
    raise exception 'Time entries cannot end in the future' using errcode = '22023';
  end if;

  if tg_op = 'INSERT' then
    if current_setting('tickist.timer_write', true) is distinct from 'on' then
      new.source := 'manual';
      new.limit_minutes := null;
    end if;
  else
    new.owner_id := old.owner_id;
    new.source := old.source;
    new.limit_minutes := old.limit_minutes;
    new.created_at := old.created_at;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_task_time_entry() from public, anon, authenticated;

drop trigger if exists guard_task_time_entry on public.task_time_entries;
create trigger guard_task_time_entry
before insert or update on public.task_time_entries
for each row
execute function public.guard_task_time_entry();

alter table public.task_time_entries enable row level security;

drop policy if exists task_time_entries_select_own on public.task_time_entries;
create policy task_time_entries_select_own
  on public.task_time_entries
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists task_time_entries_insert_own on public.task_time_entries;
create policy task_time_entries_insert_own
  on public.task_time_entries
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.tasks t
      where t.id = task_id
        and (
          t.owner_id = auth.uid()
          or (t.project_id is not null and public.can_access_project(t.project_id))
        )
    )
  );

drop policy if exists task_time_entries_update_own on public.task_time_entries;
create policy task_time_entries_update_own
  on public.task_time_entries
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.tasks t
      where t.id = task_id
        and (
          t.owner_id = auth.uid()
          or (t.project_id is not null and public.can_access_project(t.project_id))
        )
    )
  );

drop policy if exists task_time_entries_delete_own on public.task_time_entries;
create policy task_time_entries_delete_own
  on public.task_time_entries
  for delete
  to authenticated
  using (owner_id = auth.uid());

revoke all on public.task_time_entries from public, anon, authenticated;
grant select, delete on public.task_time_entries to authenticated;
grant insert (task_id, started_at, ended_at, note) on public.task_time_entries to authenticated;
grant update (task_id, started_at, ended_at, note) on public.task_time_entries to authenticated;
grant all on public.task_time_entries to service_role;

-- Cached task total: legacy minutes plus closed entries from every person.
create or replace function public.recompute_task_spent_minutes(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('tickist.spent_recompute', 'on', true);

  update public.tasks t
  set spent_minutes = case
    when t.spent_minutes_legacy is null and totals.seconds is null then null
    else coalesce(t.spent_minutes_legacy, 0) + coalesce(round(totals.seconds / 60.0)::integer, 0)
  end
  from (
    select sum(extract(epoch from (e.ended_at - e.started_at))) as seconds
    from public.task_time_entries e
    where e.task_id = p_task_id
      and e.ended_at is not null
  ) as totals
  where t.id = p_task_id;

  perform set_config('tickist.spent_recompute', 'off', true);
end;
$$;

revoke all on function public.recompute_task_spent_minutes(uuid) from public, anon, authenticated;

create or replace function public.task_time_entries_recompute()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE'
    or (tg_op = 'UPDATE' and new.task_id is distinct from old.task_id) then
    perform public.recompute_task_spent_minutes(old.task_id);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recompute_task_spent_minutes(new.task_id);
  end if;

  return null;
end;
$$;

revoke all on function public.task_time_entries_recompute() from public, anon, authenticated;

drop trigger if exists task_time_entries_recompute on public.task_time_entries;
create trigger task_time_entries_recompute
after insert or update or delete on public.task_time_entries
for each row
execute function public.task_time_entries_recompute();

-- Clients set spent time only when creating a task (it becomes legacy time,
-- which keeps backup imports exact). Later client changes are ignored.
create or replace function public.guard_task_spent_minutes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.spent_minutes_legacy := new.spent_minutes;
  elsif current_setting('tickist.spent_recompute', true) is distinct from 'on' then
    new.spent_minutes := old.spent_minutes;
    new.spent_minutes_legacy := old.spent_minutes_legacy;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_task_spent_minutes() from public, anon, authenticated;

drop trigger if exists guard_task_spent_minutes on public.tasks;
create trigger guard_task_spent_minutes
before insert or update on public.tasks
for each row
execute function public.guard_task_spent_minutes();

-- Timer RPCs use the database clock.
create or replace function public.time_entry_start(p_task_id uuid)
returns public.task_time_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_limit smallint;
  v_entry public.task_time_entries;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.tasks t
    where t.id = p_task_id
      and (
        t.owner_id = v_user
        or (t.project_id is not null and public.can_access_project(t.project_id))
      )
  ) then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;

  perform public.time_entry_stop_running(v_user);

  select u.focus_limit_minutes into v_limit
  from public.app_users u
  where u.auth_user_id = v_user;

  perform set_config('tickist.timer_write', 'on', true);
  insert into public.task_time_entries (task_id, owner_id, started_at, source, limit_minutes)
  values (p_task_id, v_user, now(), 'timer', v_limit)
  returning * into v_entry;
  perform set_config('tickist.timer_write', 'off', true);

  return v_entry;
end;
$$;

-- Closes the user's running entry at now(), or at 24 hours for a forgotten one.
-- An entry stopped in the same instant it started has no duration and is removed.
create or replace function public.time_entry_stop_running(p_user uuid)
returns public.task_time_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entry public.task_time_entries;
begin
  delete from public.task_time_entries e
  where e.owner_id = p_user
    and e.ended_at is null
    and e.started_at >= now()
  returning * into v_entry;

  if found then
    return v_entry;
  end if;

  update public.task_time_entries e
  set ended_at = least(now(), e.started_at + interval '24 hours')
  where e.owner_id = p_user
    and e.ended_at is null
  returning * into v_entry;

  return v_entry;
end;
$$;

revoke all on function public.time_entry_stop_running(uuid) from public, anon, authenticated;

create or replace function public.time_entry_stop()
returns public.task_time_entries
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  return public.time_entry_stop_running(auth.uid());
end;
$$;

revoke all on function public.time_entry_start(uuid) from public, anon;
revoke all on function public.time_entry_stop() from public, anon;
grant execute on function public.time_entry_start(uuid) to authenticated;
grant execute on function public.time_entry_stop() to authenticated;

-- Per-day, per-task totals for tasks the user can access. "Me" counts the
-- user's entries; "everyone" counts all people. A running entry counts up to
-- now (capped at 24 hours). Other people's rows are never returned.
create or replace function public.time_report_for_user(
  p_user uuid,
  p_from date,
  p_to date
)
returns table (
  work_date date,
  task_id uuid,
  my_seconds bigint,
  everyone_seconds bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_timezone text;
begin
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 366 then
    raise exception 'Report range must be 1 to 367 days' using errcode = '22023';
  end if;

  select coalesce(u.timezone, 'Europe/Warsaw') into v_timezone
  from public.app_users u
  where u.auth_user_id = p_user;

  v_timezone := coalesce(v_timezone, 'Europe/Warsaw');

  return query
  with accessible_tasks as (
    select t.id
    from public.tasks t
    left join public.projects p on p.id = t.project_id
    where t.owner_id = p_user
      or p.owner_id = p_user
      or exists (
        select 1
        from public.project_members pm
        where pm.project_id = t.project_id
          and pm.user_id = p_user
          and pm.status = 'accepted'
      )
  ),
  entries as (
    select
      (e.started_at at time zone v_timezone)::date as entry_date,
      e.task_id as entry_task_id,
      e.owner_id,
      greatest(
        0,
        extract(epoch from (
          coalesce(e.ended_at, least(now(), e.started_at + interval '24 hours'))
          - e.started_at
        ))
      )::bigint as seconds
    from public.task_time_entries e
    join accessible_tasks a on a.id = e.task_id
    where e.started_at >= (p_from::timestamp at time zone v_timezone) - interval '1 day'
      and e.started_at < ((p_to + 1)::timestamp at time zone v_timezone) + interval '1 day'
  )
  select
    entries.entry_date,
    entries.entry_task_id,
    coalesce(sum(entries.seconds) filter (where entries.owner_id = p_user), 0)::bigint,
    coalesce(sum(entries.seconds), 0)::bigint
  from entries
  where entries.entry_date between p_from and p_to
  group by entries.entry_date, entries.entry_task_id
  order by entries.entry_date, entries.entry_task_id;
end;
$$;

revoke all on function public.time_report_for_user(uuid, date, date) from public, anon, authenticated;
grant execute on function public.time_report_for_user(uuid, date, date) to service_role;

create or replace function public.time_report(p_from date, p_to date)
returns table (
  work_date date,
  task_id uuid,
  my_seconds bigint,
  everyone_seconds bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  return query
  select * from public.time_report_for_user(auth.uid(), p_from, p_to);
end;
$$;

revoke all on function public.time_report(date, date) from public, anon;
grant execute on function public.time_report(date, date) to authenticated;
