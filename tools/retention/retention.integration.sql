-- LOCAL ONLY. Run after migrations with ON_ERROR_STOP. All fixtures roll back.
begin;
create function pg_temp.check_retention(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'Retention assertion failed: %', label; end if; end; $$;
select pg_temp.check_retention(not has_function_privilege('authenticated', 'public.purge_application_history()', 'execute'), 'no authenticated purge');
select pg_temp.check_retention(not has_function_privilege('anon', 'public.purge_application_history()', 'execute'), 'no anonymous purge');
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values
 ('ae000000-0000-4000-8000-000000000001','retention-one@example.invalid','{}','{}'),
 ('ae000000-0000-4000-8000-000000000002','retention-two@example.invalid','{}','{}');
insert into public.projects(id,owner_id,name,is_inbox)
select ('ae100000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
 'ae000000-0000-4000-8000-000000000001','Retention fixture',false from generate_series(1,4) i;
insert into public.tasks(id,owner_id,project_id,name) values
 ('ae200000-0000-4000-8000-000000000001','ae000000-0000-4000-8000-000000000001','ae100000-0000-4000-8000-000000000001','Keep task');
insert into public.project_members(project_id,user_id,status)
select ('ae100000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
 'ae000000-0000-4000-8000-000000000002',case i when 2 then 'accepted' when 3 then 'declined' else 'pending' end
from generate_series(1,4) i;
-- Simulate elapsed time without bypassing the guard in normal application code.
alter table public.project_members disable trigger enforce_invitation_lifetime;
update public.project_members set invited_at=now()-interval '31 days', declined_at=now()-interval '31 days'
where user_id='ae000000-0000-4000-8000-000000000002' and project_id <> 'ae100000-0000-4000-8000-000000000004';
alter table public.project_members enable trigger enforce_invitation_lifetime;
do $$ begin
 begin
  update public.project_members set status='accepted' where project_id='ae100000-0000-4000-8000-000000000001' and user_id='ae000000-0000-4000-8000-000000000002';
  raise exception 'Expired invite accepted';
 exception when sqlstate '22023' then null;
 end;
end $$;
-- The recipient cannot reset an expired invitation's clock through direct RLS writes.
select set_config('request.jwt.claim.sub','ae000000-0000-4000-8000-000000000002',true);
do $$ begin
 begin
  update public.project_members set status='pending' where project_id='ae100000-0000-4000-8000-000000000001' and user_id='ae000000-0000-4000-8000-000000000002';
  raise exception 'Recipient renewed expired invitation';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub','',true);
insert into public.notifications(recipient_id,title,type,created_at,is_read) values
 ('ae000000-0000-4000-8000-000000000001','old-unread','test',now()-interval '181 days',false),
 ('ae000000-0000-4000-8000-000000000001','recent','test',now()-interval '179 days',true);
insert into public.activity_logs(actor_id,entity_type,action,created_at) values
 ('ae000000-0000-4000-8000-000000000001','test','old',now()-interval '91 days'),
 ('ae000000-0000-4000-8000-000000000001','test','recent',now()-interval '89 days');
insert into public.mcp_audit_events(owner_id,tool_name,request_id,created_at) values
 ('ae000000-0000-4000-8000-000000000001','test','old',now()-interval '91 days'),
 ('ae000000-0000-4000-8000-000000000001','test','recent',now()-interval '89 days');
select public.purge_application_history();
select pg_temp.check_retention((select count(*)=1 and min(title)='recent' from public.notifications where recipient_id='ae000000-0000-4000-8000-000000000001'), 'notification boundary');
select pg_temp.check_retention((select count(*)=1 and min(action)='recent' from public.activity_logs where actor_id='ae000000-0000-4000-8000-000000000001'), 'activity boundary');
select pg_temp.check_retention((select count(*)=1 and min(request_id)='recent' from public.mcp_audit_events where owner_id='ae000000-0000-4000-8000-000000000001'), 'MCP boundary');
select pg_temp.check_retention((select count(*)=2 from public.project_members where user_id='ae000000-0000-4000-8000-000000000002'), 'accepted and fresh pending survive');
select pg_temp.check_retention(exists(select 1 from public.tasks where id='ae200000-0000-4000-8000-000000000001'), 'task survives');
select pg_temp.check_retention((select count(*)=4 from public.projects where id::text like 'ae100000-%'), 'projects survive');
-- A deliberately renewed invitation gets a different key; ordinary retries do not.
do $$ declare old_key uuid; new_key uuid; begin
 select invitation_id into old_key from public.project_members where project_id='ae100000-0000-4000-8000-000000000004' and user_id='ae000000-0000-4000-8000-000000000002';
 update public.project_members set status='pending', invited_at=now() where project_id='ae100000-0000-4000-8000-000000000004' and user_id='ae000000-0000-4000-8000-000000000002';
 select invitation_id into new_key from public.project_members where project_id='ae100000-0000-4000-8000-000000000004' and user_id='ae000000-0000-4000-8000-000000000002';
 perform pg_temp.check_retention(old_key=new_key,'retry keeps invitation key');
 update public.project_members set status='declined' where project_id='ae100000-0000-4000-8000-000000000004' and user_id='ae000000-0000-4000-8000-000000000002';
 update public.project_members set status='pending' where project_id='ae100000-0000-4000-8000-000000000004' and user_id='ae000000-0000-4000-8000-000000000002';
 select invitation_id into new_key from public.project_members where project_id='ae100000-0000-4000-8000-000000000004' and user_id='ae000000-0000-4000-8000-000000000002';
 perform pg_temp.check_retention(old_key<>new_key,'new invitation has new key');
end $$;

-- Email retention and receipt lifecycle.
select pg_temp.check_retention(not has_table_privilege('authenticated','public.email_dedupe_receipts','select'), 'receipt registry private');
select pg_temp.check_retention(not has_function_privilege('anon','public.purge_email_history()','execute'), 'email purge private');
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
values ('ae000000-0000-4000-8000-000000000003','retention-email@example.invalid','{}','{}');
insert into public.email_outbox(to_email,subject,text,dedupe_key,status,sent_at,retry_at)
select 'retention-email@example.invalid','fixture','private body','retention-test:' || kind,
 case kind when 'queued' then 'queued' when 'sending' then 'sending' when 'dead' then 'dead' when 'failed' then 'failed' else 'sent' end,
 case when kind='recent' then now()-interval '29 days' else now()-interval '31 days' end,
 case when kind='retry' then now()+interval '1 day' end
from unnest(array['old','recent','queued','sending','dead','failed','retry']) kind;
alter table public.email_outbox disable trigger set_email_outbox_updated_at;
update public.email_outbox set updated_at=now()-interval '31 days' where dedupe_key like 'retention-test:%';
alter table public.email_outbox enable trigger set_email_outbox_updated_at;
-- Unclassified recipients still enqueue normally and are reported for review.
select public.enqueue_email('unknown@example.invalid','unknown fixture',null,'body','test','retention-unknown');
update public.email_outbox set status='sent',sent_at=now()-interval '31 days' where dedupe_key='retention-unknown';
select public.purge_email_history();
select pg_temp.check_retention((select count(*)=4 from public.email_outbox where dedupe_key like 'retention-test:%'), 'only terminal old rows removed');
select pg_temp.check_retention(not exists(select 1 from public.email_outbox where dedupe_key in ('retention-test:old','retention-test:dead','retention-test:failed')), 'terminal history removed');
select pg_temp.check_retention((select count(*)=7 from public.email_dedupe_receipts where owner_id='ae000000-0000-4000-8000-000000000003'), 'all hashes retained');
select pg_temp.check_retention(public.enqueue_email('retention-email@example.invalid','replay',null,'body','test','retention-test:old') is null, 'purged message cannot be requeued');
select pg_temp.check_retention(exists(select 1 from public.email_outbox where dedupe_key='retention-unknown'), 'unknown recipient preserved');
-- A failed insertion must not reserve a key permanently.
do $$ begin
 begin
  insert into public.email_outbox(to_email,subject,dedupe_key,status) values ('retention-email@example.invalid','bad','retention-invalid','queued');
  raise exception 'Expected content constraint';
 exception when check_violation then null;
 end;
 perform pg_temp.check_retention(not exists(select 1 from public.email_dedupe_receipts where key_hash=sha256(convert_to('retention-invalid','UTF8'))), 'failed insert rolls back receipt');
end $$;
-- Finish active fixture work before exercising the existing account-deletion guard.
update public.email_outbox set status='sent',sent_at=now(),retry_at=null where owner_id='ae000000-0000-4000-8000-000000000003';
delete from auth.users where id='ae000000-0000-4000-8000-000000000003';
select pg_temp.check_retention(not exists(select 1 from public.email_dedupe_receipts where owner_id='ae000000-0000-4000-8000-000000000003'), 'account deletion removes receipts');
select pg_temp.check_retention(not exists(select 1 from public.email_outbox where owner_id='ae000000-0000-4000-8000-000000000003'), 'account deletion removes email rows');

rollback;
