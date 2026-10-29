-- A reminder scheduled by a user must point to the future. The task editor
-- saves automatically, and a date input passes through past values while the
-- year is typed (0002-10-31, 0202-10-31, ...); such a reminder was claimed and
-- emailed at once. Five minutes of tolerance cover browser clock skew.
-- Server-side workers (no user) are not limited.

create or replace function public.require_future_task_reminder()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null or new.status <> 'scheduled' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and new.remind_at is not distinct from old.remind_at
     and old.status = 'scheduled' then
    return new;
  end if;

  if new.remind_at < now() - interval '5 minutes' then
    raise exception 'Reminder time must be in the future'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.require_future_task_reminder()
from public, anon, authenticated;

drop trigger if exists require_future_task_reminder on public.task_reminders;
create trigger require_future_task_reminder
before insert or update of remind_at, status on public.task_reminders
for each row
execute function public.require_future_task_reminder();
