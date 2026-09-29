-- Approved operational retention. No application tasks/projects are removed.
-- Legacy invitations without a timestamp get a full retention window at rollout.
alter table public.project_members add column invitation_id uuid not null default gen_random_uuid();
update public.project_members set invited_at = now() where status = 'pending' and invited_at is null;
update public.project_members set declined_at = now() where status = 'declined' and declined_at is null;

create function public.enforce_invitation_lifetime()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if old.status = 'pending' and new.status = 'accepted'
       and old.invited_at <= now() - interval '30 days' then
      raise exception 'Invitation expired; ask the owner to send a new invitation' using errcode = '22023';
    end if;
    if old.status = 'accepted' and new.status = 'pending' then
      raise exception 'An accepted membership cannot be replaced by an invitation';
    end if;
    if new.status = 'pending' and (old.status <> 'pending' or old.invited_at <= now() - interval '30 days') then
      if auth.uid() is not null and not exists (
        select 1 from public.projects where id = new.project_id and owner_id = auth.uid()
      ) then
        raise exception 'Only the project owner can renew an invitation' using errcode = '42501';
      end if;
      new.invitation_id := gen_random_uuid();
      new.invited_at := now();
    else
      new.invitation_id := old.invitation_id;
      if old.status = 'pending' and new.status = 'pending' then
        new.invited_at := old.invited_at;
      end if;
    end if;
    if new.status = 'declined' then
      if old.status <> 'declined' then new.declined_at := now();
      else new.declined_at := old.declined_at;
      end if;
    end if;
  else
    new.invitation_id := gen_random_uuid();
    if new.status = 'pending' then new.invited_at := now(); end if;
    if new.status = 'declined' then new.declined_at := now(); end if;
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_invitation_lifetime() from public, anon, authenticated;
create trigger enforce_invitation_lifetime before insert or update on public.project_members
for each row execute function public.enforce_invitation_lifetime();

create index notifications_retention_idx on public.notifications(created_at);
create index activity_logs_retention_idx on public.activity_logs(created_at);
create index mcp_audit_events_retention_idx on public.mcp_audit_events(created_at);

create function public.purge_application_history()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  notifications_count bigint; invitations_count bigint; mcp_count bigint; activity_count bigint;
begin
  set local lock_timeout = '5s';
  delete from public.notifications where created_at <= now() - interval '180 days';
  get diagnostics notifications_count = row_count;
  delete from public.project_members
    where (status = 'pending' and invited_at <= now() - interval '30 days')
       or (status = 'declined' and declined_at <= now() - interval '30 days');
  get diagnostics invitations_count = row_count;
  delete from public.mcp_audit_events where created_at <= now() - interval '90 days';
  get diagnostics mcp_count = row_count;
  delete from public.activity_logs where created_at <= now() - interval '90 days';
  get diagnostics activity_count = row_count;
  return jsonb_build_object('notifications', notifications_count, 'invitations', invitations_count,
    'mcp_audit_events', mcp_count, 'activity_logs', activity_count);
end;
$$;
revoke all on function public.purge_application_history() from public, anon, authenticated;
grant execute on function public.purge_application_history() to service_role;
select cron.schedule('purge-application-history-daily', '37 3 * * *',
  'select public.purge_application_history();');

-- Approved minimal dedupe receipts last until account deletion. Unknown legacy
-- recipients retain normal delivery behavior and are excluded from auto-purge.
create table public.email_dedupe_receipts (
  key_hash bytea primary key,
  owner_id uuid not null references auth.users(id) on delete cascade
);
alter table public.email_dedupe_receipts enable row level security;
revoke all on public.email_dedupe_receipts from public, anon, authenticated;
grant select, insert, delete on public.email_dedupe_receipts to service_role;
create policy email_dedupe_service on public.email_dedupe_receipts for all to service_role
using (true) with check (true);
create index email_dedupe_owner_idx on public.email_dedupe_receipts(owner_id);
alter table public.email_outbox add column owner_id uuid references auth.users(id) on delete cascade;
create index email_outbox_owner_idx on public.email_outbox(owner_id);
create index email_outbox_retention_idx on public.email_outbox(status, updated_at);

create function public.email_retention_owner(recipient text, dedupe text)
returns uuid language sql stable security definer set search_path = '' as $$
  select case when count(distinct id) = 1 then (array_agg(distinct id))[1] end
  from (
    select u.id from auth.users u where lower(u.email) = lower(recipient)
    union
    select u.id from auth.users u where position(u.id::text in dedupe) > 0
    union
    select r.owner_id from public.task_reminders r where dedupe = 'task_reminder:' || r.id::text
  ) candidates;
$$;
revoke all on function public.email_retention_owner(text,text) from public, anon, authenticated;

update public.email_outbox set owner_id = public.email_retention_owner(to_email, dedupe_key);
insert into public.email_dedupe_receipts(key_hash,owner_id)
select sha256(convert_to(dedupe_key,'UTF8')), owner_id from public.email_outbox where owner_id is not null
on conflict do nothing;

create function public.reserve_email_deduplication()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.email_dedupe_receipts
    where key_hash=sha256(convert_to(new.dedupe_key,'UTF8'))) then return null; end if;
  new.owner_id := public.email_retention_owner(new.to_email, new.dedupe_key);
  -- Do not disrupt delivery to recipients we cannot safely classify.
  if new.owner_id is null then return new; end if;
  insert into public.email_dedupe_receipts(key_hash,owner_id)
  values (sha256(convert_to(new.dedupe_key,'UTF8')), new.owner_id)
  on conflict do nothing;
  if not found then return null; end if;
  return new;
end;
$$;
revoke all on function public.reserve_email_deduplication() from public, anon, authenticated;
create trigger reserve_email_deduplication before insert on public.email_outbox
for each row execute function public.reserve_email_deduplication();

create function public.purge_email_history()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare deleted_count bigint; unresolved_count bigint;
begin
  set local lock_timeout = '5s';
  delete from public.email_outbox e
  where e.owner_id is not null and e.retry_at is null
    and ((e.status = 'sent' and e.sent_at <= now() - interval '30 days')
      or (e.status in ('failed','dead') and e.updated_at <= now() - interval '30 days'))
    and exists (select 1 from public.email_dedupe_receipts d
      where d.key_hash = sha256(convert_to(e.dedupe_key,'UTF8')) and d.owner_id=e.owner_id);
  get diagnostics deleted_count = row_count;
  select count(*) into unresolved_count from public.email_outbox
    where owner_id is null and status in ('sent','failed','dead');
  return jsonb_build_object('deleted',deleted_count,'legacy_rows_requiring_review',unresolved_count);
end;
$$;
revoke all on function public.purge_email_history() from public, anon, authenticated;
grant execute on function public.purge_email_history() to service_role;
select cron.schedule('purge-email-history-daily', '47 3 * * *', 'select public.purge_email_history();');
