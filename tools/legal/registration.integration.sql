-- LOCAL ONLY. All documents below are test fixtures, never real legal publications.
begin;
create function pg_temp.legal_assert(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'Legal assertion failed: %', label; end if; end; $$;
-- Deselect deployment releases inside this rollback-only test; never delete them.
update public.legal_releases set is_current=false where is_current;
do $$ begin
 begin
  insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values ('af000000-0000-4000-8000-000000000001','legal@example.invalid','{}','{}');
  raise exception 'Expected unavailable registration';
 exception when raise_exception then
  if sqlerrm <> 'Registration is unavailable until legal documents are published' then raise; end if;
 end;
end $$;
insert into public.legal_releases(version,locale,terms_text,privacy_text,published_at,is_current)
values ('test-v1','en','Fixture terms, not for publication','Fixture privacy, not for publication',now()-interval '1 day',true);
do $$ begin
 begin
  insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values ('af000000-0000-4000-8000-000000000001','legal@example.invalid','{"legal_version":"test-v1"}','{}');
  raise exception 'Expected missing acceptance failure';
 exception when raise_exception then
  if sqlerrm <> 'Accept the current Terms of Service before registration' then raise; end if;
 end;
 begin
  insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values ('af000000-0000-4000-8000-000000000001','legal@example.invalid','{"legal_version":"outdated","terms_accepted":true}','{}');
  raise exception 'Expected stale version failure';
 exception when raise_exception then
  if sqlerrm <> 'Accept the current Terms of Service before registration' then raise; end if;
 end;
end $$;
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
values ('af000000-0000-4000-8000-000000000001','legal@example.invalid','{"legal_version":"test-v1","terms_accepted":true,"accepted_at":"1900-01-01"}','{}');
select pg_temp.legal_assert(exists(select 1 from public.legal_acceptances where user_id='af000000-0000-4000-8000-000000000001' and version='test-v1' and accepted_at=now()), 'server records version and server timestamp');
update auth.users set raw_user_meta_data='{}' where id='af000000-0000-4000-8000-000000000001';
select pg_temp.legal_assert(exists(select 1 from public.legal_acceptances where user_id='af000000-0000-4000-8000-000000000001' and version='test-v1'), 'metadata edit does not alter evidence');
select pg_temp.legal_assert(not has_table_privilege('authenticated','public.legal_acceptances','insert'), 'users cannot create evidence');
select pg_temp.legal_assert(not has_table_privilege('authenticated','public.legal_acceptances','update'), 'users cannot modify evidence');
do $$ begin
 begin
  update public.legal_releases set terms_text='changed' where version='test-v1';
  raise exception 'Expected immutable version';
 exception when raise_exception then
  if sqlerrm <> 'Publish a new legal version instead of changing an existing document' then raise; end if;
 end;
end $$;
insert into public.legal_releases(version,locale,terms_text,privacy_text,published_at)
values ('future','en','Fixture','Fixture',now()+interval '1 day');
set local role anon;
do $$ begin
 if exists(select 1 from public.legal_releases where version='future') then raise exception 'Future legal release exposed to anon'; end if;
end $$;
reset role;
select pg_temp.legal_assert((select count(*)=1 from public.legal_releases where is_current and published_at<=now()),'one current published release');
select set_config('request.jwt.claim.sub','af000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.legal_acceptances) <> 1 then raise exception 'Owner cannot read acceptance'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','af000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.legal_acceptances) then raise exception 'Another account can read acceptance'; end if;
end $$;
reset role;
-- Provisioned/confirmed operator users do not fabricate terms acceptance.
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data)
values ('af000000-0000-4000-8000-000000000002','operator-test@example.invalid',now(),'{}','{}');
select pg_temp.legal_assert(not exists(select 1 from public.legal_acceptances where user_id='af000000-0000-4000-8000-000000000002'), 'no invented operator consent');
-- Locally autoconfirmed signups still record explicitly supplied acceptance.
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data)
values ('af000000-0000-4000-8000-000000000003','confirmed-fixture@example.invalid',now(),'{"legal_version":"test-v1","terms_accepted":true}','{}');
select pg_temp.legal_assert(exists(select 1 from public.legal_acceptances where user_id='af000000-0000-4000-8000-000000000003'), 'autoconfirmed signup with acceptance is recorded');
update public.legal_releases set is_current=false where version='test-v1';
insert into public.legal_releases(version,locale,terms_text,privacy_text,published_at,is_current)
values ('test-v2','en','Fixture v2','Fixture v2',now(),true);
do $$ begin
 begin
  insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values ('af000000-0000-4000-8000-000000000004','stale-fixture@example.invalid','{"legal_version":"test-v1","terms_accepted":true}','{}');
  raise exception 'Expected previous release rejection';
 exception when raise_exception then
  if sqlerrm <> 'Accept the current Terms of Service before registration' then raise; end if;
 end;
end $$;
select pg_temp.legal_assert(exists(select 1 from public.legal_releases where version='test-v1'), 'old document remains available');
delete from auth.users where id='af000000-0000-4000-8000-000000000001';
select pg_temp.legal_assert(not exists(select 1 from public.legal_acceptances where user_id='af000000-0000-4000-8000-000000000001'), 'account deletion removes acceptance');
rollback;
