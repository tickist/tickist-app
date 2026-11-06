-- LOCAL ONLY. Run after migrations with ON_ERROR_STOP. All fixtures roll back.
-- Covers migration 0040: task time entries, timer RPCs, cached task totals,
-- the day report, shared-project access and value limits.
begin;
create function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'Time tracking assertion failed: %', label; end if; end; $$;
create function pg_temp.act_as(user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', user_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', user_id, 'role', 'authenticated')::text, true);
end; $$;
grant execute on all functions in schema pg_temp to authenticated;

insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data) values
 ('a7000000-0000-4000-8000-000000000001','time-owner@example.invalid',now(),'{}','{}'),
 ('a7000000-0000-4000-8000-000000000002','time-member@example.invalid',now(),'{}','{}'),
 ('a7000000-0000-4000-8000-000000000003','time-stranger@example.invalid',now(),'{}','{}');
update public.app_users set timezone = 'Europe/Warsaw', focus_limit_minutes = 45
where auth_user_id = 'a7000000-0000-4000-8000-000000000001';
update public.app_users set focus_limit_minutes = null
where auth_user_id = 'a7000000-0000-4000-8000-000000000002';
insert into public.projects(id,owner_id,name,is_inbox) values
 ('a7100000-0000-4000-8000-000000000001','a7000000-0000-4000-8000-000000000001','Private',false),
 ('a7100000-0000-4000-8000-000000000002','a7000000-0000-4000-8000-000000000001','Shared',false);
insert into public.tasks(id,owner_id,project_id,name,spent_minutes) values
 ('a7200000-0000-4000-8000-000000000001','a7000000-0000-4000-8000-000000000001','a7100000-0000-4000-8000-000000000001','Private task',30),
 ('a7200000-0000-4000-8000-000000000002','a7000000-0000-4000-8000-000000000001','a7100000-0000-4000-8000-000000000002','Shared task',null);
insert into public.project_members(project_id,user_id,status) values
 ('a7100000-0000-4000-8000-000000000002','a7000000-0000-4000-8000-000000000002','accepted');

select pg_temp.check(
  (select spent_minutes = 30 and spent_minutes_legacy = 30 from public.tasks
   where id = 'a7200000-0000-4000-8000-000000000001'),
  'spent time given at creation becomes legacy time');

set local role authenticated;
select pg_temp.act_as('a7000000-0000-4000-8000-000000000001');

-- Manual entries add to the task total; legacy minutes stay.
insert into public.task_time_entries(task_id, started_at, ended_at, note)
values ('a7200000-0000-4000-8000-000000000001', '2026-10-04 08:00+00', '2026-10-04 08:40+00', 'Forgot the timer');
select pg_temp.check(
  (select spent_minutes = 70 from public.tasks where id = 'a7200000-0000-4000-8000-000000000001'),
  'manual entry updates task total');
select pg_temp.check(
  (select source = 'manual' and limit_minutes is null and owner_id = 'a7000000-0000-4000-8000-000000000001'
   from public.task_time_entries where note = 'Forgot the timer'),
  'browser insert is manual and owned by the caller');

-- Clients cannot change the cached total or forge server-controlled fields.
update public.tasks set spent_minutes = 999 where id = 'a7200000-0000-4000-8000-000000000001';
select pg_temp.check(
  (select spent_minutes = 70 from public.tasks where id = 'a7200000-0000-4000-8000-000000000001'),
  'client spent_minutes writes are ignored');
do $$ begin
  update public.task_time_entries set source = 'timer';
  raise exception 'source update was allowed';
exception when insufficient_privilege then null; end $$;
do $$ begin
  insert into public.task_time_entries(task_id, owner_id, started_at, ended_at)
  values ('a7200000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000002', '2026-10-03 08:00+00', '2026-10-03 09:00+00');
  raise exception 'owner_id insert was allowed';
exception when insufficient_privilege then null; end $$;

-- Value rules.
do $$ begin
  insert into public.task_time_entries(task_id, started_at, ended_at)
  values ('a7200000-0000-4000-8000-000000000001', '2026-10-04 08:30+00', '2026-10-04 09:00+00');
  raise exception 'overlap was allowed';
exception when exclusion_violation then null; end $$;
do $$ begin
  insert into public.task_time_entries(task_id, started_at, ended_at)
  values ('a7200000-0000-4000-8000-000000000001', '2026-10-01 08:00+00', '2026-10-02 09:00+00');
  raise exception 'entry longer than 24 hours was allowed';
exception when check_violation then null; end $$;
do $$ begin
  insert into public.task_time_entries(task_id, started_at, ended_at)
  values ('a7200000-0000-4000-8000-000000000001', now() + interval '1 hour', now() + interval '2 hours');
  raise exception 'future entry was allowed';
exception when invalid_parameter_value then null; end $$;
do $$ begin
  insert into public.task_time_entries(task_id, started_at)
  values ('a7200000-0000-4000-8000-000000000001', '2026-10-02 08:00+00');
  raise exception 'open manual entry was allowed';
exception when check_violation then null; end $$;
do $$ begin
  insert into public.task_time_entries(task_id, started_at, ended_at)
  values ('a7200000-0000-4000-8000-000000000001', 'infinity', 'infinity');
  raise exception 'infinity was allowed';
exception when check_violation or invalid_parameter_value then null; end $$;

-- A forgotten timer closes at 24 hours.
reset role;
select set_config('tickist.timer_write', 'on', true);
insert into public.task_time_entries(task_id, owner_id, started_at, source)
values ('a7200000-0000-4000-8000-000000000002', 'a7000000-0000-4000-8000-000000000001', now() - interval '30 hours', 'timer');
select set_config('tickist.timer_write', 'off', true);
set local role authenticated;
select pg_temp.check(
  (select ended_at - started_at = interval '24 hours' from public.time_entry_stop()),
  'forgotten timer is capped at 24 hours');

-- Timer: start copies the limit, a second start stops the first entry.
select pg_temp.check(
  (select source = 'timer' and limit_minutes = 45 and ended_at is null
   from public.time_entry_start('a7200000-0000-4000-8000-000000000001')),
  'timer starts with the account limit');
select public.time_entry_start('a7200000-0000-4000-8000-000000000002');
select pg_temp.check(
  (select count(*) = 1 from public.task_time_entries where ended_at is null),
  'one running entry per person');
select pg_temp.check(
  (select count(*) = 0 from public.task_time_entries
   where task_id = 'a7200000-0000-4000-8000-000000000001' and source = 'timer'),
  'zero-length timer entry is removed when another starts');
reset role;
update public.task_time_entries set started_at = now() - interval '10 minutes' where ended_at is null;
set local role authenticated;
select pg_temp.check(
  (select ended_at = now() and ended_at - started_at = interval '10 minutes' from public.time_entry_stop()),
  'stop closes the running entry');
select pg_temp.check(
  (select count(*) = 0 from public.task_time_entries where ended_at is null),
  'nothing runs after stop');

-- Collaborator logs time on the shared task; a stranger cannot.
select pg_temp.act_as('a7000000-0000-4000-8000-000000000002');
insert into public.task_time_entries(task_id, started_at, ended_at)
values ('a7200000-0000-4000-8000-000000000002', '2026-10-04 10:00+00', '2026-10-04 10:30+00');
select pg_temp.check(
  (select limit_minutes is null from public.time_entry_start('a7200000-0000-4000-8000-000000000002')),
  'no limit setting starts without a limit');
select public.time_entry_stop();
select pg_temp.check(
  (select count(*) >= 1 and bool_and(owner_id = 'a7000000-0000-4000-8000-000000000002')
   from public.task_time_entries),
  'collaborator sees only own entries');
select pg_temp.act_as('a7000000-0000-4000-8000-000000000003');
do $$ begin
  insert into public.task_time_entries(task_id, started_at, ended_at)
  values ('a7200000-0000-4000-8000-000000000002', '2026-10-04 11:00+00', '2026-10-04 11:30+00');
  raise exception 'stranger logged time';
exception when insufficient_privilege then null; end $$;
do $$ begin
  perform public.time_entry_start('a7200000-0000-4000-8000-000000000001');
  raise exception 'stranger started a timer';
exception when no_data_found then null; end $$;
select pg_temp.check(
  (select count(*) = 0 from public.time_report('2026-10-04', '2026-10-04')),
  'stranger report is empty');

-- Report: own and everyone totals, account timezone day boundary.
select pg_temp.act_as('a7000000-0000-4000-8000-000000000001');
insert into public.task_time_entries(task_id, started_at, ended_at)
values ('a7200000-0000-4000-8000-000000000002', '2026-10-04 23:30+00', '2026-10-05 00:00+00');
select pg_temp.check(
  (select my_seconds = 2400 and everyone_seconds = 2400 from public.time_report('2026-10-04', '2026-10-04')
   where task_id = 'a7200000-0000-4000-8000-000000000001'),
  'own task day total');
select pg_temp.check(
  (select my_seconds = 0 and everyone_seconds = 1800 from public.time_report('2026-10-04', '2026-10-04')
   where task_id = 'a7200000-0000-4000-8000-000000000002'),
  'collaborator time counts for everyone only');
select pg_temp.check(
  (select my_seconds = 1800 from public.time_report('2026-10-05', '2026-10-05')
   where task_id = 'a7200000-0000-4000-8000-000000000002'),
  '23:30 UTC belongs to the next day in Warsaw');
do $$ begin
  perform * from public.time_report('2026-01-01', '2027-06-01');
  raise exception 'long range accepted';
exception when invalid_parameter_value then null; end $$;

-- Deleting entries recomputes the total; deleting a task removes entries.
delete from public.task_time_entries where note = 'Forgot the timer';
select pg_temp.check(
  (select spent_minutes between 30 and 31 from public.tasks where id = 'a7200000-0000-4000-8000-000000000001'),
  'delete recomputes total');

reset role;
delete from public.tasks where id = 'a7200000-0000-4000-8000-000000000002';
select pg_temp.check(
  (select count(*) = 0 from public.task_time_entries where task_id = 'a7200000-0000-4000-8000-000000000002'),
  'task deletion removes entries');
select pg_temp.check(
  not has_table_privilege('authenticated', 'public.task_time_entries', 'TRIGGER')
  and not has_table_privilege('authenticated', 'public.task_time_entries', 'TRUNCATE')
  and not has_table_privilege('authenticated', 'public.task_time_entries', 'REFERENCES')
  and not has_table_privilege('anon', 'public.task_time_entries', 'SELECT')
  and not has_function_privilege('authenticated', 'public.time_report_for_user(uuid, date, date)', 'EXECUTE'),
  'privileges stay narrow');

rollback;
select 'Time tracking integration passed' as result;
