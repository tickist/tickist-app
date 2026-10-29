-- Data hardening from the security review.
-- 1. User-writable timestamps reject infinity, which otherwise sorts first in
--    the reminder queue forever.
-- 2. One account cannot starve others in the shared reminder queue or the
--    shared email budget: reminders are capped per task and per owner, each
--    claim takes at most five due reminders per owner, an owner gets at most 50
--    reminder emails per day, and task-resume notifications stop after 20 a day.
-- 3. User text columns get database length limits, and text shown to another
--    user is cleaned of control and bidirectional characters.
-- 4. Avatar object names reject dot segments and long names.
-- The pg_net helpers (net schema) are owned and granted by supabase_admin, so a
-- migration cannot revoke them; the schema stays outside the Data API instead.

alter table public.task_reminders
drop constraint if exists task_reminders_remind_at_finite;
alter table public.task_reminders
add constraint task_reminders_remind_at_finite
check (isfinite(remind_at)) not valid;

alter table public.tasks
drop constraint if exists tasks_suspend_until_finite;
alter table public.tasks
add constraint tasks_suspend_until_finite
check (suspend_until is null or isfinite(suspend_until)) not valid;

alter table public.tasks
drop constraint if exists tasks_finish_date_finite;
alter table public.tasks
add constraint tasks_finish_date_finite
check (finish_date is null or isfinite(finish_date)) not valid;

-- Existing longer values stay readable; the limits apply to new writes.
alter table public.projects
drop constraint if exists projects_name_length;
alter table public.projects
add constraint projects_name_length
check (char_length(name) <= 200) not valid;

alter table public.projects
drop constraint if exists projects_description_length;
alter table public.projects
add constraint projects_description_length
check (char_length(description) <= 100000) not valid;

alter table public.tasks
drop constraint if exists tasks_name_length;
alter table public.tasks
add constraint tasks_name_length
check (char_length(name) <= 2000) not valid;

alter table public.tasks
drop constraint if exists tasks_description_length;
alter table public.tasks
add constraint tasks_description_length
check (char_length(description) <= 100000) not valid;

alter table public.task_steps
drop constraint if exists task_steps_content_length;
alter table public.task_steps
add constraint task_steps_content_length
check (char_length(content) <= 2000) not valid;

alter table public.tags
drop constraint if exists tags_name_length;
alter table public.tags
add constraint tags_name_length
check (char_length(name) <= 100) not valid;

create or replace function public.limit_task_reminders()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Server-side workers (no user) are not limited.
  if auth.uid() is null or new.status <> 'scheduled' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('task_reminders:' || new.owner_id::text, 0));

  if new.task_id is not null and (
    select count(*)
    from public.task_reminders r
    where r.task_id = new.task_id
      and r.status = 'scheduled'
  ) >= 20 then
    raise exception 'A task can have at most 20 scheduled reminders'
      using errcode = '54000';
  end if;

  if (
    select count(*)
    from public.task_reminders r
    where r.owner_id = new.owner_id
      and r.status = 'scheduled'
  ) >= 500 then
    raise exception 'An account can have at most 500 scheduled reminders'
      using errcode = '54000';
  end if;

  return new;
end;
$$;

revoke all on function public.limit_task_reminders()
from public, anon, authenticated;

drop trigger if exists limit_task_reminders on public.task_reminders;
create trigger limit_task_reminders
before insert on public.task_reminders
for each row
execute function public.limit_task_reminders();

create or replace function public.claim_due_task_reminders(p_limit integer default 25)
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
  saturated_owners as (
    select r.owner_id
    from public.task_reminders r
    where r.status = 'sent'
      and r.sent_at > now() - interval '1 day'
    group by r.owner_id
    having count(*) >= 50
  ),
  fair_due as (
    select ranked.id
    from (
      select
        r.id,
        row_number() over (
          partition by r.owner_id
          order by r.remind_at asc, r.created_at asc
        ) as owner_rank
      from public.task_reminders r
      where r.status in ('scheduled', 'failed')
        and r.remind_at <= now()
        and r.owner_id not in (select owner_id from saturated_owners)
    ) ranked
    where ranked.owner_rank <= 5
  ),
  candidates as (
    select r.id
    from public.task_reminders r
    where r.id in (select id from fair_due)
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

-- One resume email per task per day; at most 20 resume notifications and
-- emails per recipient per day, so toggling tasks cannot flood the outbox.
create or replace function public.notify_task_resumed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid := gen_random_uuid();
  recipient_email text;
  task_name text;
  dedupe text := format('task_resumed:%s:%s', new.id, current_date);
begin
  if old.is_active = false
    and new.is_active = true
    and new.is_done = false then
    if exists (select 1 from public.email_outbox where dedupe_key = dedupe) then
      return new;
    end if;

    if (
      select count(*)
      from public.notifications n
      where n.recipient_id = new.owner_id
        and n.type = 'task-resumed'
        and n.created_at > now() - interval '1 day'
    ) >= 20 then
      return new;
    end if;

    task_name := coalesce(public.clean_display_text(new.name, 200), 'Task');

    insert into public.notifications (
      id,
      recipient_id,
      title,
      description,
      type,
      icon
    )
    values (
      notification_id,
      new.owner_id,
      'Task resumed',
      format('Task "%s" is active again.', task_name),
      'task-resumed',
      'play'
    );

    select lower(trim(u.email))
      into recipient_email
    from auth.users u
    where u.id = new.owner_id;

    if coalesce(recipient_email, '') <> '' then
      perform public.enqueue_email(
        recipient_email,
        format(
          'Task resumed: %s',
          coalesce(public.clean_display_text(new.name, 120), 'Task')
        ),
        null,
        format('Your task "%s" is active again in Tickist.', task_name),
        'task_resumed',
        dedupe
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.notify_task_resumed()
from public, anon, authenticated;

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
           public.clean_display_text(auth_users.raw_user_meta_data ->> 'full_name', 80),
           public.clean_display_text(auth_users.raw_user_meta_data ->> 'name', 80),
           public.clean_display_text(app_users.username, 80),
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

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and name !~ '(^|/)\.\.?(/|$)'
    and char_length(name) <= 255
  );

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and name !~ '(^|/)\.\.?(/|$)'
    and char_length(name) <= 255
  );
