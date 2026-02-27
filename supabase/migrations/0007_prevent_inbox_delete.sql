-- Prevent deleting inbox projects. Inbox is a required system project per owner.
create or replace function public.prevent_inbox_delete()
returns trigger
language plpgsql
as $$
begin
  if old.is_inbox = true then
    raise exception using
      errcode = 'P0001',
      message = 'Inbox project cannot be deleted';
  end if;

  return old;
end;
$$;

drop trigger if exists prevent_inbox_delete_on_projects on public.projects;

create trigger prevent_inbox_delete_on_projects
before delete on public.projects
for each row
execute function public.prevent_inbox_delete();
