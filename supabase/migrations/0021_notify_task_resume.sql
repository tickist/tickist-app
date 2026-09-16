create or replace function public.notify_task_resumed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid := gen_random_uuid();
  recipient_email text;
  notification_description text;
begin
  if old.is_active = false
    and new.is_active = true
    and new.is_done = false then
    notification_description := format(
      'Task "%s" is active again.',
      new.name
    );

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
      notification_description,
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
        format('Task resumed: %s', new.name),
        null,
        format(
          'Your task "%s" is active again in Tickist.',
          new.name
        ),
        'task_resumed',
        format('task_resumed:%s', notification_id)
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.notify_task_resumed()
from public, anon, authenticated;

drop trigger if exists notify_task_resumed on public.tasks;
create trigger notify_task_resumed
after update of is_active on public.tasks
for each row
when (old.is_active = false and new.is_active = true)
execute function public.notify_task_resumed();
