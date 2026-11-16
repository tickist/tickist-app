-- Recurrence units. repeat_interval stays a whole number of days so clients
-- that only know it keep working; repeat_unit says how to read it:
--   day      every N calendar days        (interval = N)
--   workday  every working day, Mon-Fri    (interval = 1)
--   week     every N weeks                 (interval = 7 * N)
--   month    every N calendar months       (interval = 30 * N)
--   year     every N calendar years        (interval = 365 * N)

alter table public.tasks
add column if not exists repeat_unit text null;

alter table public.tasks
drop constraint if exists tasks_repeat_unit_values;
alter table public.tasks
add constraint tasks_repeat_unit_values
check (
  repeat_unit is null
  or repeat_unit in ('day', 'workday', 'week', 'month', 'year')
);

-- The unit a bare day count most likely meant (Monthly was stored as 30 days,
-- Yearly as 365). Must match inferRepeatUnit in libs/data-access/tickist.
create or replace function public.infer_repeat_unit(p_interval integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_interval is null or p_interval <= 0 then null
    when p_interval % 365 = 0 then 'year'
    when p_interval % 30 = 0 then 'month'
    when p_interval % 7 = 0 then 'week'
    else 'day'
  end;
$$;

-- Keeps repeat_unit consistent with repeat_interval. Writers that only change
-- repeat_interval (older app versions, the personal-token bridge) get the
-- inferred unit whenever the old unit no longer fits the new interval.
create or replace function public.normalize_task_repeat_unit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(new.repeat_interval, 0) <= 0 then
    new.repeat_unit := null;
  elsif not coalesce(
    new.repeat_unit = 'day'
    or (new.repeat_unit = 'workday' and new.repeat_interval = 1)
    or (new.repeat_unit = 'week' and new.repeat_interval % 7 = 0)
    or (new.repeat_unit = 'month' and new.repeat_interval % 30 = 0)
    or (new.repeat_unit = 'year' and new.repeat_interval % 365 = 0),
    false
  ) then
    new.repeat_unit := public.infer_repeat_unit(new.repeat_interval);
  end if;

  return new;
end;
$$;

revoke all on function public.normalize_task_repeat_unit()
from public, anon, authenticated;

-- Backfill without touching modification_date: this is a data-format change,
-- not a user edit.
alter table public.tasks disable trigger set_tasks_activity_fields;

update public.tasks
set repeat_unit = public.infer_repeat_unit(repeat_interval)
where coalesce(repeat_interval, 0) > 0
  and repeat_unit is null;

alter table public.tasks enable trigger set_tasks_activity_fields;

drop trigger if exists normalize_task_repeat_unit on public.tasks;
create trigger normalize_task_repeat_unit
before insert or update of repeat_interval, repeat_unit on public.tasks
for each row
execute function public.normalize_task_repeat_unit();
