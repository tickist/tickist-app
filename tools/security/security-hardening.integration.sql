-- LOCAL ONLY. Run after migrations with ON_ERROR_STOP. All fixtures roll back.
-- Covers migrations 0036-0038: auth metadata limits, repeat sign-up password
-- reset, invitation privacy, connected-app limits, finite timestamps, reminder
-- fairness, text limits, browser-role table privileges and avatar object names.
begin;
create function pg_temp.check_hardening(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'Hardening assertion failed: %', label; end if; end; $$;
create function pg_temp.act_as(user_id uuid, extra jsonb default '{}'::jsonb) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', user_id::text, true);
  perform set_config('request.jwt.claims', (jsonb_build_object('sub', user_id, 'role', 'authenticated') || extra)::text, true);
end; $$;
create function pg_temp.reset_actor() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
end; $$;
grant execute on all functions in schema pg_temp to authenticated;

-- Fixture legal release so unconfirmed sign-ups pass the registration trigger.
update public.legal_releases set is_current=false where is_current;
insert into public.legal_releases(version,locale,terms_text,privacy_text,published_at,is_current)
values ('hardening-v1','en','Fixture terms, not for publication','Fixture privacy, not for publication',now()-interval '1 day',true);

-- Auth metadata is capped in the database.
do $$ begin
 begin
  insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data) values
   ('ae000000-0000-4000-8000-0000000000ff','huge@example.invalid',now(),
    jsonb_build_object('full_name', repeat('x', 20000)),'{}');
  raise exception 'Oversized metadata accepted';
 exception when invalid_parameter_value then null;
 end;
end $$;

insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data,encrypted_password,created_at) values
 ('ae000000-0000-4000-8000-000000000001','hardening-owner@example.invalid',now(),
  jsonb_build_object('full_name', E'‮Owner' || repeat('n', 200) || E'\n'),'{}','owner-hash',now()),
 ('ae000000-0000-4000-8000-000000000002','hardening-invitee@example.invalid',now(),'{}','{}','invitee-hash',now());
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data,encrypted_password,created_at) values
 ('ae000000-0000-4000-8000-000000000003','hardening-squatted@example.invalid',
  '{"legal_version":"hardening-v1","terms_accepted":true}','{}','attacker-hash',now()-interval '10 minutes'),
 ('ae000000-0000-4000-8000-000000000004','hardening-fresh@example.invalid',
  '{"legal_version":"hardening-v1","terms_accepted":true}','{}','fresh-hash',now());

select pg_temp.check_hardening(
  (select char_length(username) = 80 and username !~ '[[:cntrl:]]' and position(E'‮' in username) = 0
   from public.app_users where auth_user_id='ae000000-0000-4000-8000-000000000001'),
  'username from metadata is clamped and cleaned');
select pg_temp.check_hardening(public.find_auth_user_id_by_email('hardening-squatted@example.invalid') is null,
  'invitations ignore unconfirmed accounts');
select pg_temp.check_hardening(public.find_auth_user_id_by_email('hardening-invitee@example.invalid')='ae000000-0000-4000-8000-000000000002',
  'invitations resolve confirmed accounts');

-- A repeat sign-up for an unconfirmed account clears the first password.
update auth.users set confirmation_sent_at=now()
where id in ('ae000000-0000-4000-8000-000000000003','ae000000-0000-4000-8000-000000000004','ae000000-0000-4000-8000-000000000002');
select pg_temp.check_hardening((select encrypted_password from auth.users where id='ae000000-0000-4000-8000-000000000003')='',
  'repeat sign-up clears the squatted password');
select pg_temp.check_hardening((select encrypted_password from auth.users where id='ae000000-0000-4000-8000-000000000004')='fresh-hash',
  'a fresh sign-up keeps its password');
select pg_temp.check_hardening((select encrypted_password from auth.users where id='ae000000-0000-4000-8000-000000000002')='invitee-hash',
  'confirmed accounts keep their password');

insert into public.projects(id,owner_id,name,is_inbox) values
 ('ae100000-0000-4000-8000-000000000001','ae000000-0000-4000-8000-000000000001','Hardening project',false);
insert into public.tasks(id,owner_id,project_id,name) values
 ('ae200000-0000-4000-8000-000000000001','ae000000-0000-4000-8000-000000000001','ae100000-0000-4000-8000-000000000001','Hardening task');

-- The project-invite function records every invitation and, for a known
-- account, a hidden membership row.
insert into public.project_invitations(project_id,invited_email,invited_by) values
 ('ae100000-0000-4000-8000-000000000001','hardening-invitee@example.invalid','ae000000-0000-4000-8000-000000000001'),
 ('ae100000-0000-4000-8000-000000000001','nobody@example.invalid','ae000000-0000-4000-8000-000000000001');
insert into public.project_members(project_id,user_id,status,invited_email,invited_by) values
 ('ae100000-0000-4000-8000-000000000001','ae000000-0000-4000-8000-000000000002','pending','hardening-invitee@example.invalid','ae000000-0000-4000-8000-000000000001');

set local role authenticated;
select pg_temp.act_as('ae000000-0000-4000-8000-000000000001');
select pg_temp.check_hardening((select count(*) from public.project_invitations)=2,
  'owner sees known and unknown invitations alike');
select pg_temp.check_hardening(not exists (select 1 from public.project_members where project_id='ae100000-0000-4000-8000-000000000001'),
  'owner cannot see the pending invitee or their user id');

-- Connected apps cannot cancel or accept invitations.
select pg_temp.act_as('ae000000-0000-4000-8000-000000000001', '{"client_id":"mcp-client"}');
delete from public.project_invitations where invited_email='nobody@example.invalid';
select pg_temp.act_as('ae000000-0000-4000-8000-000000000001');
select pg_temp.check_hardening((select count(*) from public.project_invitations)=2,
  'connected app cannot cancel an invitation');
select pg_temp.act_as('ae000000-0000-4000-8000-000000000002', '{"client_id":"mcp-client"}');
do $$ begin
 begin
  update public.project_members set status='accepted', accepted_at=now()
  where project_id='ae100000-0000-4000-8000-000000000001' and user_id='ae000000-0000-4000-8000-000000000002';
  raise exception 'Connected app accepted an invitation';
 exception when insufficient_privilege then null;
 end;
end $$;

-- Accepting turns the invitation into a visible member.
select pg_temp.act_as('ae000000-0000-4000-8000-000000000002');
update public.project_members set status='accepted', accepted_at=now()
where project_id='ae100000-0000-4000-8000-000000000001' and user_id='ae000000-0000-4000-8000-000000000002';
select pg_temp.act_as('ae000000-0000-4000-8000-000000000001');
select pg_temp.check_hardening((select count(*) from public.project_invitations)=1,
  'accepted invitation leaves the invitation list');
select pg_temp.check_hardening(exists (select 1 from public.project_members where user_id='ae000000-0000-4000-8000-000000000002' and status='accepted'),
  'owner sees the accepted member');

-- Cancelling an invitation withdraws the hidden membership row.
select pg_temp.reset_actor();
reset role;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data) values
 ('ae000000-0000-4000-8000-000000000005','hardening-second@example.invalid',now(),'{}','{}');
insert into public.project_invitations(project_id,invited_email,invited_by) values
 ('ae100000-0000-4000-8000-000000000001','hardening-second@example.invalid','ae000000-0000-4000-8000-000000000001');
insert into public.project_members(project_id,user_id,status,invited_email,invited_by) values
 ('ae100000-0000-4000-8000-000000000001','ae000000-0000-4000-8000-000000000005','pending','Hardening-Second@example.invalid','ae000000-0000-4000-8000-000000000001');
set local role authenticated;
select pg_temp.act_as('ae000000-0000-4000-8000-000000000001');
delete from public.project_invitations where invited_email='hardening-second@example.invalid';
select pg_temp.reset_actor();
reset role;
select pg_temp.check_hardening(not exists (select 1 from public.project_members where user_id='ae000000-0000-4000-8000-000000000005'),
  'cancelled invitation removes the pending membership');

-- Timestamps reject infinity; text columns have limits.
set local role authenticated;
select pg_temp.act_as('ae000000-0000-4000-8000-000000000001');
do $$ begin
 begin
  insert into public.task_reminders(task_id,owner_id,remind_at)
  values ('ae200000-0000-4000-8000-000000000001','ae000000-0000-4000-8000-000000000001','-infinity');
  raise exception 'Infinite reminder accepted';
 exception when check_violation then null;
 end;
 begin
  update public.tasks set suspend_until='infinity' where id='ae200000-0000-4000-8000-000000000001';
  raise exception 'Infinite suspension accepted';
 exception when check_violation then null;
 end;
 begin
  update public.tasks set name=repeat('t', 2001) where id='ae200000-0000-4000-8000-000000000001';
  raise exception 'Oversized task name accepted';
 exception when check_violation then null;
 end;
 begin
  update public.app_users set username=repeat('u', 81) where auth_user_id='ae000000-0000-4000-8000-000000000001';
  raise exception 'Oversized username accepted';
 exception when check_violation then null;
 end;
end $$;

-- Reminders are capped per task.
insert into public.task_reminders(task_id,owner_id,remind_at)
select 'ae200000-0000-4000-8000-000000000001','ae000000-0000-4000-8000-000000000001',now()-make_interval(mins => n)
from generate_series(1, 20) n;
do $$ begin
 begin
  insert into public.task_reminders(task_id,owner_id,remind_at)
  values ('ae200000-0000-4000-8000-000000000001','ae000000-0000-4000-8000-000000000001',now()-interval '2 days');
  raise exception 'Reminder cap exceeded';
 exception when program_limit_exceeded then null;
 end;
end $$;

-- A claim takes at most five due reminders per owner, so others are served.
select pg_temp.reset_actor();
reset role;
insert into public.tasks(id,owner_id,name) values
 ('ae200000-0000-4000-8000-000000000002','ae000000-0000-4000-8000-000000000002','Invitee task');
insert into public.task_reminders(task_id,owner_id,remind_at) values
 ('ae200000-0000-4000-8000-000000000002','ae000000-0000-4000-8000-000000000002',now()-interval '1 minute');
create temp table claimed on commit drop as
select * from public.claim_due_task_reminders(100);
select pg_temp.check_hardening((select count(*) from claimed where owner_id='ae000000-0000-4000-8000-000000000001') <= 5,
  'one owner gets at most five reminders per claim');
select pg_temp.check_hardening(exists (select 1 from claimed where owner_id='ae000000-0000-4000-8000-000000000002'),
  'another owner is not starved');

-- Assignee labels are cleaned for other users.
set local role authenticated;
select pg_temp.act_as('ae000000-0000-4000-8000-000000000002');
select pg_temp.check_hardening(
  (select bool_and(char_length(label) <= 80 and position(E'‮' in label) = 0)
   from public.list_accessible_project_assignees()),
  'assignee labels are clamped and cleaned');

-- Avatar object names reject dot segments.
select pg_temp.act_as('ae000000-0000-4000-8000-000000000001');
do $$ begin
 begin
  insert into storage.objects(bucket_id,name,owner_id)
  values ('avatars','ae000000-0000-4000-8000-000000000001/../ae000000-0000-4000-8000-000000000002/avatar.png','ae000000-0000-4000-8000-000000000001');
  raise exception 'Dot-segment avatar name accepted';
 exception when insufficient_privilege then null;
 end;
end $$;
select pg_temp.reset_actor();
reset role;

-- Browser roles cannot add triggers (which could call HTTP helpers) or bypass
-- row-level security with TRUNCATE on application tables.
select pg_temp.check_hardening(not exists (
  select 1
  from information_schema.role_table_grants
  where table_schema = 'public'
    and grantee in ('anon', 'authenticated')
    and privilege_type in ('TRIGGER', 'TRUNCATE', 'REFERENCES')
), 'no trigger, truncate or references grants for browser roles');

-- Task-resume notifications stop after 20 per recipient per day.
insert into public.tasks(id,owner_id,name,is_active)
select ('ae3' || lpad(n::text, 5, '0') || '-0000-4000-8000-000000000000')::uuid,
       'ae000000-0000-4000-8000-000000000001','Resume ' || n, false
from generate_series(1, 25) n;
update public.tasks set is_active=true
where owner_id='ae000000-0000-4000-8000-000000000001' and name like 'Resume %';
select pg_temp.check_hardening(
  (select count(*) from public.notifications
   where recipient_id='ae000000-0000-4000-8000-000000000001' and type='task-resumed') = 20,
  'task-resume notifications are capped');

rollback;
