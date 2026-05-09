create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_key text not null,
  channel text not null default 'email',
  enabled boolean not null default false,
  schedule_type text not null,
  day_of_week smallint,
  time_of_day time not null default '20:00:00',
  timezone text not null default 'UTC',
  config jsonb not null default '{}'::jsonb,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_key_check
    check (notification_key in ('weekly_summary', 'daily_summary')),
  constraint notification_preferences_channel_check
    check (channel in ('email')),
  constraint notification_preferences_schedule_check
    check (schedule_type in ('daily', 'weekly')),
  constraint notification_preferences_day_check
    check (
      (schedule_type = 'daily' and day_of_week is null)
      or (schedule_type = 'weekly' and day_of_week between 0 and 6)
    )
);

create unique index if not exists notification_preferences_user_key_channel_idx
  on public.notification_preferences (user_id, notification_key, channel);

create index if not exists notification_preferences_channel_enabled_idx
  on public.notification_preferences (channel, enabled);

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

drop policy if exists notification_preferences_select_owner on public.notification_preferences;
create policy notification_preferences_select_owner
  on public.notification_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists notification_preferences_insert_owner on public.notification_preferences;
create policy notification_preferences_insert_owner
  on public.notification_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists notification_preferences_update_owner on public.notification_preferences;
create policy notification_preferences_update_owner
  on public.notification_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists notification_preferences_delete_owner on public.notification_preferences;
create policy notification_preferences_delete_owner
  on public.notification_preferences
  for delete
  using (auth.uid() = user_id);
