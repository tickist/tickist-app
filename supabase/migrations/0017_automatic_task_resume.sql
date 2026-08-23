create extension if not exists pg_cron;

create index if not exists tasks_pending_resume_idx
  on public.tasks (suspend_until)
  where is_active = false
    and is_done = false
    and suspend_until is not null;

create or replace function public.resume_due_tasks()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  resumed_count integer;
begin
  update public.tasks
  set
    is_active = true,
    suspend_until = null
  where is_active = false
    and is_done = false
    and suspend_until is not null
    and suspend_until <= now();

  get diagnostics resumed_count = row_count;
  return resumed_count;
end;
$$;

revoke all on function public.resume_due_tasks()
from public, anon, authenticated;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid
    from cron.job
    where jobname = 'resume-suspended-tasks-every-minute'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'resume-suspended-tasks-every-minute',
  '* * * * *',
  $cron$select public.resume_due_tasks();$cron$
);

select public.resume_due_tasks();
