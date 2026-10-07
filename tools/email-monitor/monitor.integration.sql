-- Only run in the disposable database created by test-db.sh.
begin;
create function pg_temp.check_monitor(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'Monitor assertion failed: %', label; end if; end; $$;
select pg_temp.check_monitor((select is_admin from public.profiles
  where user_id = 'ac000000-0000-4000-8000-000000000001'),
  'existing administrator migrated to profile flag');
select pg_temp.check_monitor((select not is_admin from public.profiles
  where user_id = 'ac000000-0000-4000-8000-000000000002'),
  'ordinary account defaults to false');
insert into auth.users(id) values ('ac000000-0000-4000-8000-000000000003');
select pg_temp.check_monitor((select not is_admin from public.profiles
  where user_id = 'ac000000-0000-4000-8000-000000000003'),
  'new account defaults to false');
update auth.users set raw_user_meta_data = '{"is_admin":true}'::jsonb
  where id = 'ac000000-0000-4000-8000-000000000002';
select pg_temp.check_monitor((select not is_admin from public.profiles
  where user_id = 'ac000000-0000-4000-8000-000000000002'),
  'Auth profile metadata cannot promote account');
select pg_temp.check_monitor(not has_function_privilege('authenticated',
  'public.record_email_delivery_health(jsonb,integer,text[],boolean)','execute'),'user cannot write monitor');
select pg_temp.check_monitor(not has_function_privilege('anon',
  'public.get_email_delivery_overview()','execute'),'anonymous cannot get panel');
select pg_temp.check_monitor(not has_table_privilege('authenticated',
  'public.app_administrators','insert'),'no self promotion');
select pg_temp.check_monitor(not has_table_privilege('authenticated',
  'public.profiles','insert'),'no profile insert privilege');
select pg_temp.check_monitor(not has_table_privilege('authenticated',
  'public.profiles','update'),'no profile update privilege');
select pg_temp.check_monitor(not has_table_privilege('authenticated',
  'public.profiles','delete'),'no profile delete privilege');
select pg_temp.check_monitor(not has_function_privilege('authenticated',
  'public.create_admin_profile()','execute'),'no profile creation RPC');
select pg_temp.check_monitor(not has_function_privilege('authenticated',
  'public.claim_email_monitor_alerts(uuid)','execute'),'no user SNS publication');

create function pg_temp.sample(sent integer) returns jsonb language sql as $$
 select jsonb_build_object('region','eu-north-1','sent_last_24h',sent,'max_24h_send',100,
 'max_send_rate',1,'sending_enabled',true,'production_access_enabled',true,'unexpected','private');
$$;
select public.record_email_delivery_health(pg_temp.sample(80),100,array['usage_warning'],true);
select public.record_email_delivery_health(pg_temp.sample(81),100,array['usage_warning'],true);
select pg_temp.check_monitor((select count(*)=1 from public.email_monitor_alerts),'warning once per incident');
select public.record_email_delivery_health(pg_temp.sample(95),100,array['usage_warning','usage_critical'],true);
select public.record_email_delivery_health(pg_temp.sample(100),100,array['usage_warning','usage_critical','quota_exhausted'],true);
select pg_temp.check_monitor((select count(*)=3 from public.email_monitor_alerts),'escalates 80 to 95 to exhausted');
select public.record_email_delivery_health(null,100,array['monitor_unavailable'],true);
select public.record_email_delivery_health(null,100,array['monitor_unavailable'],true);
select pg_temp.check_monitor((select count(*)=4 from public.email_monitor_alerts),'monitor failure deduplicated');
select pg_temp.check_monitor((select sample->>'sent_last_24h'='100' and not monitor_available
  and checked_at is not null and not(sample ? 'unexpected') from public.email_delivery_health),'last good reading preserved, extra data stripped');
select public.record_email_delivery_health(pg_temp.sample(100),100,array['usage_warning','usage_critical','quota_exhausted'],true);
select pg_temp.check_monitor((select count(*)=4 from public.email_monitor_alerts),'failed read does not reopen quota incident');

set local role authenticated;
select set_config('request.jwt.claim.sub','ac000000-0000-4000-8000-000000000002',true);
select pg_temp.check_monitor(not public.is_app_administrator(),'ordinary user not administrator');
select pg_temp.check_monitor((select not is_admin from public.profiles
  where user_id = 'ac000000-0000-4000-8000-000000000002'),
  'user can read only own false flag');
select pg_temp.check_monitor((select count(*) = 1 from public.profiles),
  'RLS hides other profiles');
do $$ begin
 begin
  update public.profiles set is_admin = true where user_id = auth.uid();
  raise exception 'Ordinary user promoted own profile';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.profiles(user_id, is_admin) values (auth.uid(), true);
  raise exception 'Ordinary user inserted admin profile';
 exception when insufficient_privilege then null;
 end;
 begin
  delete from public.profiles where user_id = auth.uid();
  raise exception 'Ordinary user deleted own profile';
 exception when insufficient_privilege then null;
 end;
end $$;
select pg_temp.check_monitor((select count(*)=0 from public.email_delivery_health),'RLS hides health');
select pg_temp.check_monitor((select count(*)=0 from public.email_monitor_alerts),'RLS hides alert history');
do $$ begin
 begin
  perform public.get_email_delivery_overview();
  raise exception 'Ordinary user read panel';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;

insert into public.email_outbox(to_email,subject,text,dedupe_key,status) values
 ('private-recipient@example.invalid','private-subject','private-content','monitor-test','failed');
select public.record_email_delivery_health(pg_temp.sample(0),100,array[]::text[],true);
select pg_temp.check_monitor((select count(*)=1 from public.email_monitor_alerts where kind='delivery_failure'),'outbox failure alert');
set local role authenticated;
select set_config('request.jwt.claim.sub','ac000000-0000-4000-8000-000000000001',true);
select pg_temp.check_monitor(public.is_app_administrator(),'operator membership admitted');
select pg_temp.check_monitor((public.get_email_delivery_overview()->'outbox'->>'failed')::integer=1,'admin gets aggregate');
select pg_temp.check_monitor(public.get_email_delivery_overview()::text not like '%private-%','no recipients or message content in panel');
reset role;

-- Jump to 100: only the highest usage event is queued.
delete from public.email_monitor_alerts;
update public.email_monitor_alert_state set active=false;
select public.record_email_delivery_health(pg_temp.sample(100),100,array['usage_warning','usage_critical','quota_exhausted'],true);
select pg_temp.check_monitor((select count(*)=1 from public.email_monitor_alerts where kind like 'usage_%' or kind='quota_exhausted'),'one highest usage alert');
-- Claim ownership prevents duplicate overlapping workers or stale acknowledgements.
select count(*) from public.claim_email_monitor_alerts('ac100000-0000-4000-8000-000000000001');
select pg_temp.check_monitor((select count(*)=0 from public.claim_email_monitor_alerts('ac100000-0000-4000-8000-000000000002')),'claimed work not claimed twice');
select public.finish_email_monitor_alert(id,'ac100000-0000-4000-8000-000000000002',true) from public.email_monitor_alerts;
select pg_temp.check_monitor((select bool_and(status='sending') from public.email_monitor_alerts),'stale worker cannot acknowledge');
select public.finish_email_monitor_alert(id,'ac100000-0000-4000-8000-000000000001',false) from public.email_monitor_alerts;
select pg_temp.check_monitor((select bool_and(status='pending' and attempt_count=1 and retry_at>now()) from public.email_monitor_alerts),'SNS failure retries with delay');
update public.email_monitor_alerts set retry_at=now(), attempt_count=4;
select count(*) from public.claim_email_monitor_alerts('ac100000-0000-4000-8000-000000000003');
select public.finish_email_monitor_alert(id,'ac100000-0000-4000-8000-000000000003',false) from public.email_monitor_alerts;
select pg_temp.check_monitor((select bool_and(status='failed' and attempt_count=5) from public.email_monitor_alerts),'SNS retries bounded');
select pg_temp.check_monitor((select count(*)=0 from public.claim_email_monitor_alerts('ac100000-0000-4000-8000-000000000004')),'failed publication not infinite');
-- The old membership row must not keep access after the operator clears the flag.
update public.profiles set is_admin = false
  where user_id = 'ac000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','ac000000-0000-4000-8000-000000000001',true);
select pg_temp.check_monitor(not public.is_app_administrator(),
  'cleared profile flag revokes legacy administrator');
do $$ begin
 begin
  perform public.get_email_delivery_overview();
  raise exception 'Revoked administrator read panel';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
-- An operator can grant and remove access by changing only the profile flag.
update public.profiles set is_admin = true
  where user_id = 'ac000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','ac000000-0000-4000-8000-000000000002',true);
select pg_temp.check_monitor(public.is_app_administrator(),
  'operator-set flag grants access');
select pg_temp.check_monitor(public.get_email_delivery_overview() is not null,
  'new administrator can read panel');
reset role;
update public.profiles set is_admin = false
  where user_id = 'ac000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','ac000000-0000-4000-8000-000000000002',true);
select pg_temp.check_monitor(not public.is_app_administrator(),
  'operator-cleared flag removes access');
reset role;
rollback;
