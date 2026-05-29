create table if not exists public.task_reminders (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  channel text not null default 'email',
  remind_at timestamptz not null,
  timezone text not null default 'UTC',
  status text not null default 'scheduled',
  attempt_count integer not null default 0,
  last_error text null,
  sent_at timestamptz null,
  cancelled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_reminders_channel_check
    check (channel in ('email')),
  constraint task_reminders_status_check
    check (status in ('scheduled', 'processing', 'sent', 'cancelled', 'failed', 'dead')),
  constraint task_reminders_timezone_check
    check (length(btrim(timezone)) between 1 and 100)
);

create unique index if not exists task_reminders_task_channel_time_idx
  on public.task_reminders (task_id, channel, remind_at)
  where task_id is not null;

create index if not exists task_reminders_status_remind_at_idx
  on public.task_reminders (status, remind_at);

create index if not exists task_reminders_owner_task_idx
  on public.task_reminders (owner_id, task_id);

drop trigger if exists set_task_reminders_updated_at on public.task_reminders;
create trigger set_task_reminders_updated_at
before update on public.task_reminders
for each row
execute function public.set_updated_at();

alter table public.task_reminders enable row level security;

drop policy if exists task_reminders_select_owner on public.task_reminders;
create policy task_reminders_select_owner
  on public.task_reminders
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists task_reminders_insert_owner on public.task_reminders;
create policy task_reminders_insert_owner
  on public.task_reminders
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.tasks t
      where t.id = task_reminders.task_id
        and t.owner_id = auth.uid()
    )
  );

drop policy if exists task_reminders_update_owner on public.task_reminders;
create policy task_reminders_update_owner
  on public.task_reminders
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.tasks t
      where t.id = task_reminders.task_id
        and t.owner_id = auth.uid()
    )
  );

drop policy if exists task_reminders_delete_owner on public.task_reminders;
create policy task_reminders_delete_owner
  on public.task_reminders
  for delete
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists task_reminders_service_role_all on public.task_reminders;
create policy task_reminders_service_role_all
  on public.task_reminders
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.claim_due_task_reminders(
  p_limit integer default 25
)
returns setof public.task_reminders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 25), 100));
begin
  return query
  with recovered as (
    update public.task_reminders r
    set
      status = 'scheduled',
      last_error = coalesce(r.last_error, 'Recovered stale processing lock')
    where r.status = 'processing'
      and r.updated_at < now() - interval '15 minutes'
    returning r.id
  ),
  candidates as (
    select r.id
    from public.task_reminders r
    where r.status in ('scheduled', 'failed')
      and r.remind_at <= now()
    order by r.remind_at asc, r.created_at asc
    for update skip locked
    limit v_limit
  )
  update public.task_reminders r
  set
    status = 'processing',
    last_error = null
  from candidates c
  where r.id = c.id
  returning r.*;
end;
$$;

revoke all on function public.claim_due_task_reminders(integer)
from public, anon, authenticated;
grant execute on function public.claim_due_task_reminders(integer)
to service_role;
