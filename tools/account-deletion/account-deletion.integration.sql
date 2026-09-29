-- LOCAL ONLY. All fixture changes roll back; never reset existing local data.
begin;
set local lock_timeout = '5s';
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'Assertion failed: %', label; end if; end; $$;
select pg_temp.assert_true(not has_function_privilege('authenticated', 'public.account_deletion_preview(uuid)', 'execute'), 'authenticated cannot inspect accounts');
select pg_temp.assert_true(not has_function_privilege('anon', 'public.account_deletion_preview(uuid)', 'execute'), 'anon cannot inspect accounts');
select pg_temp.assert_true(has_function_privilege('service_role', 'public.account_deletion_preview(uuid)', 'execute'), 'service role can inspect');

select pg_temp.assert_true(not exists(select 1 from public.migration_audit), 'test requires an empty legacy audit store; do not delete real audit data');
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
values ('ad000000-0000-4000-8000-000000000001', 'delete-test@example.invalid', '{}', '{}'),
       ('ad000000-0000-4000-8000-000000000002', 'keep-test@example.invalid', '{}', '{}');
insert into public.projects(id, owner_id, name, is_inbox)
values ('ad100000-0000-4000-8000-000000000001', 'ad000000-0000-4000-8000-000000000001', 'Deletion fixture', false),
       ('ad100000-0000-4000-8000-000000000002', 'ad000000-0000-4000-8000-000000000002', 'Surviving fixture', false);
insert into public.tasks(id, owner_id, project_id, name, author_id)
values ('ad200000-0000-4000-8000-000000000001', 'ad000000-0000-4000-8000-000000000001', 'ad100000-0000-4000-8000-000000000001', 'Delete me', 'ad000000-0000-4000-8000-000000000001'),
       ('ad200000-0000-4000-8000-000000000002', 'ad000000-0000-4000-8000-000000000002', 'ad100000-0000-4000-8000-000000000002', 'Keep me', 'ad000000-0000-4000-8000-000000000001');
insert into public.project_members(project_id,user_id,role)
values ('ad100000-0000-4000-8000-000000000001','ad000000-0000-4000-8000-000000000002','editor');
select pg_temp.assert_true(public.account_deletion_preview('ad000000-0000-4000-8000-000000000001')->'blockers' ? 'shared_work_requires_review', 'shared preview');
do $$ begin
  begin
    delete from auth.users where id='ad000000-0000-4000-8000-000000000001';
    raise exception 'Deletion incorrectly succeeded';
  exception when raise_exception then
    if sqlerrm not like 'Account deletion blocked:%' then raise; end if;
  end;
end $$;
delete from public.project_members where project_id='ad100000-0000-4000-8000-000000000001' and user_id='ad000000-0000-4000-8000-000000000002';

-- The browser creates Inbox; construct one explicitly for this fixture.
insert into public.projects(owner_id,name,is_inbox)
select 'ad000000-0000-4000-8000-000000000001','Inbox',true
where not exists(select 1 from public.projects where owner_id='ad000000-0000-4000-8000-000000000001' and is_inbox);
select pg_temp.assert_true(exists(select 1 from public.projects where owner_id='ad000000-0000-4000-8000-000000000001' and is_inbox), 'Inbox exists');
do $$ begin
  begin
    delete from public.projects where owner_id='ad000000-0000-4000-8000-000000000001' and is_inbox;
    raise exception 'Inbox deletion incorrectly succeeded';
  exception when raise_exception then
    if sqlerrm <> 'Inbox project cannot be deleted' then raise; end if;
  end;
end $$;
insert into public.email_outbox(to_email,subject,text,dedupe_key)
values ('delete-test@example.invalid','test','test','delete-test'),
       ('keep-test@example.invalid','test','test','keep-test');
insert into public.activity_logs(actor_id,entity_type,action)
values ('ad000000-0000-4000-8000-000000000001','account','fixture');
insert into public.task_steps(task_id,content) values ('ad200000-0000-4000-8000-000000000001','fixture');

insert into public.api_tokens(owner_id,token_hash,token_prefix) values ('ad000000-0000-4000-8000-000000000001','account-deletion-test-hash','tk_test');

-- Active sends, unclassified historical records and undeleted files must block.
update public.email_outbox set status='sending' where dedupe_key='delete-test';
select pg_temp.assert_true(public.account_deletion_preview('ad000000-0000-4000-8000-000000000001')->'blockers' ? 'email_delivery_in_progress', 'active email blocks');
update public.email_outbox set status='queued' where dedupe_key='delete-test';
insert into public.migration_audit(scope,payload) values ('deletion-test','{}');
select pg_temp.assert_true(public.account_deletion_preview('ad000000-0000-4000-8000-000000000001')->'blockers' ? 'migration_audit_requires_review', 'legacy audit blocks');
delete from public.migration_audit where scope='deletion-test';
-- Metadata-only fixture, no physical file is created; revert its savepoint.
savepoint avatar_fixture;
insert into storage.objects(bucket_id,name,owner,owner_id)
values ('avatars','ad000000-0000-4000-8000-000000000001/avatar','ad000000-0000-4000-8000-000000000001','ad000000-0000-4000-8000-000000000001');
do $$ begin
  begin
    delete from auth.users where id='ad000000-0000-4000-8000-000000000001';
    raise exception 'Deletion incorrectly succeeded with avatar';
  exception when raise_exception then
    if sqlerrm <> 'Remove account avatars through the Storage API first' then raise; end if;
  end;
end $$;
rollback to savepoint avatar_fixture;

-- SQL assertions exercise the same trigger used by Auth admin hard deletion.
delete from auth.users where id='ad000000-0000-4000-8000-000000000001';
select pg_temp.assert_true(not exists(select 1 from public.projects where owner_id='ad000000-0000-4000-8000-000000000001'), 'all owned projects including Inbox removed');
select pg_temp.assert_true(not exists(select 1 from public.tasks where owner_id='ad000000-0000-4000-8000-000000000001'), 'owned tasks removed');
select pg_temp.assert_true(not exists(select 1 from public.task_steps where task_id='ad200000-0000-4000-8000-000000000001'), 'steps removed');
select pg_temp.assert_true(not exists(select 1 from public.activity_logs where actor_id='ad000000-0000-4000-8000-000000000001'), 'activity removed');
select pg_temp.assert_true(not exists(select 1 from public.email_outbox where to_email='delete-test@example.invalid'), 'email removed');
select pg_temp.assert_true(exists(select 1 from public.email_outbox where dedupe_key='keep-test'), 'unrelated email survives');
select pg_temp.assert_true(exists(select 1 from public.tasks where id='ad200000-0000-4000-8000-000000000002' and author_id is null), 'other task survives, author cleared');
select pg_temp.assert_true(not exists(select 1 from public.api_tokens where token_hash='account-deletion-test-hash'), 'personal token removed');
select set_config('request.jwt.claim.sub','ad000000-0000-4000-8000-000000000001',true);
select pg_temp.assert_true(not public.tickist_current_account_exists(), 'old JWT no longer represents existing account');
set local role authenticated;
do $$ begin
  begin
    insert into storage.objects(bucket_id,name,owner,owner_id)
    values ('avatars','ad000000-0000-4000-8000-000000000001/recreated','ad000000-0000-4000-8000-000000000001','ad000000-0000-4000-8000-000000000001');
    raise exception 'Stale account recreated an avatar';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
