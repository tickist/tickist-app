-- Add stable IDs for cross-instance export/import support.
alter table public.projects
  add column if not exists stable_id uuid;

update public.projects
set stable_id = id
where stable_id is null;

alter table public.projects
  alter column stable_id set default uuid_generate_v4(),
  alter column stable_id set not null;

create unique index if not exists projects_owner_stable_id_idx
  on public.projects (owner_id, stable_id);

alter table public.tags
  add column if not exists stable_id uuid;

update public.tags
set stable_id = id
where stable_id is null;

alter table public.tags
  alter column stable_id set default uuid_generate_v4(),
  alter column stable_id set not null;

create unique index if not exists tags_owner_stable_id_idx
  on public.tags (owner_id, stable_id);

alter table public.tasks
  add column if not exists stable_id uuid;

update public.tasks
set stable_id = id
where stable_id is null;

alter table public.tasks
  alter column stable_id set default uuid_generate_v4(),
  alter column stable_id set not null;

create unique index if not exists tasks_owner_stable_id_idx
  on public.tasks (owner_id, stable_id);

alter table public.task_steps
  add column if not exists stable_id uuid;

update public.task_steps
set stable_id = id
where stable_id is null;

alter table public.task_steps
  alter column stable_id set default uuid_generate_v4(),
  alter column stable_id set not null;

create unique index if not exists task_steps_task_stable_id_idx
  on public.task_steps (task_id, stable_id);
