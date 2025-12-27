-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Profiles table keeps application-specific metadata for auth.users
create table if not exists public.app_users (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text,
  preferences jsonb not null default '{}'::jsonb,
  inbox_project_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.app_users is 'Profile information mapped 1:1 with Supabase auth.users';

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  color text default '#394264',
  icon text default 'tick',
  is_active boolean not null default true,
  is_inbox boolean not null default false,
  project_type text not null default 'active',
  ancestor_id uuid references public.projects(id) on delete set null,
  default_finish_date smallint default 0,
  default_priority text default 'normal',
  default_type_finish_date smallint default 1,
  dialog_time_when_task_finished boolean default false,
  task_view text default 'extended',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_idx on public.projects (owner_id);
create index if not exists projects_ancestor_idx on public.projects (ancestor_id);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer',
  invited_via text,
  invited_at timestamptz default now(),
  primary key (project_id, user_id)
);

create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tags_owner_name_idx on public.tags (owner_id, lower(name));

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  last_editor_id uuid references auth.users(id) on delete set null,
  name text not null,
  description text default '',
  finish_date timestamptz,
  finish_time text,
  suspend_until timestamptz,
  pinned boolean not null default false,
  is_active boolean not null default true,
  is_done boolean not null default false,
  on_hold boolean not null default false,
  type_finish_date smallint default 1,
  priority text default 'normal',
  repeat_interval integer default 0,
  repeat_delta integer,
  from_repeating integer,
  estimate_minutes integer,
  spent_minutes integer,
  task_type text default 'normal',
  when_complete timestamptz,
  creation_date timestamptz default now(),
  modification_date timestamptz default now()
);

create index if not exists tasks_owner_idx on public.tasks (owner_id);
create index if not exists tasks_project_idx on public.tasks (project_id);
create index if not exists tasks_is_active_idx on public.tasks (is_active) where is_active = true;

create table if not exists public.task_steps (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  content text not null,
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists task_steps_task_idx on public.task_steps (task_id);

create table if not exists public.task_tags (
  task_id uuid not null references public.tasks(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

create table if not exists public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'assignee',
  primary key (task_id, user_id)
);

-- simple logging table for future notifications/migrations
create table if not exists public.migration_audit (
  id bigserial primary key,
  scope text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  type text not null,
  icon text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx on public.notifications (recipient_id, is_read);

create table if not exists public.routine_reminders (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  cron text not null,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create index if not exists routine_owner_idx on public.routine_reminders (owner_id);

create table if not exists public.activity_logs (
  id bigserial primary key,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
