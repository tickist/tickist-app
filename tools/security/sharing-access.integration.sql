-- LOCAL ONLY. Run after migrations with ON_ERROR_STOP. All fixtures roll back.
-- Covers migration 0033: membership retargeting, task ownership/moves,
-- consent for direct sharing, API token creation, and MCP audit integrity.
begin;
create function pg_temp.check_access(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'Access assertion failed: %', label; end if; end; $$;
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

insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data) values
 ('af000000-0000-4000-8000-000000000001','access-owner@example.invalid',now(),'{}','{}'),
 ('af000000-0000-4000-8000-000000000002','access-attacker@example.invalid',now(),'{}','{}'),
 ('af000000-0000-4000-8000-000000000003','access-stranger@example.invalid',now(),'{}','{}');
insert into public.projects(id,owner_id,name,is_inbox) values
 ('af100000-0000-4000-8000-000000000001','af000000-0000-4000-8000-000000000001','Victim project',false),
 ('af100000-0000-4000-8000-000000000002','af000000-0000-4000-8000-000000000002','Attacker project',false),
 ('af100000-0000-4000-8000-000000000003','af000000-0000-4000-8000-000000000001','Shared project',false);
insert into public.tasks(id,owner_id,project_id,name) values
 ('af200000-0000-4000-8000-000000000001','af000000-0000-4000-8000-000000000001','af100000-0000-4000-8000-000000000001','Private task'),
 ('af200000-0000-4000-8000-000000000002','af000000-0000-4000-8000-000000000002','af100000-0000-4000-8000-000000000002','Attacker task'),
 ('af200000-0000-4000-8000-000000000003','af000000-0000-4000-8000-000000000001','af100000-0000-4000-8000-000000000003','Shared owner task');
-- The attacker is an accepted collaborator only on the shared project.
insert into public.project_members(project_id,user_id,status) values
 ('af100000-0000-4000-8000-000000000003','af000000-0000-4000-8000-000000000002','accepted');

set local role authenticated;

-- Owners cannot add themselves to create a movable membership row.
select pg_temp.act_as('af000000-0000-4000-8000-000000000002');
do $$ begin
 begin
  insert into public.project_members(project_id,user_id) values
   ('af100000-0000-4000-8000-000000000002','af000000-0000-4000-8000-000000000002');
  raise exception 'Owner added themselves as a member';
 exception when insufficient_privilege then null;
 end;
end $$;

-- An accepted member cannot retarget their membership to another project.
do $$ declare moved integer; begin
 begin
  update public.project_members set project_id='af100000-0000-4000-8000-000000000001'
  where project_id='af100000-0000-4000-8000-000000000003' and user_id='af000000-0000-4000-8000-000000000002';
  get diagnostics moved = row_count;
  if moved > 0 then raise exception 'Membership moved to victim project'; end if;
 exception when insufficient_privilege then null;
 end;
end $$;
select pg_temp.check_access(not public.can_access_project('af100000-0000-4000-8000-000000000001'), 'no access to victim project');
select pg_temp.check_access(not exists(select 1 from public.tasks where id='af200000-0000-4000-8000-000000000001'), 'victim task hidden');

-- Tasks cannot be handed to another user or planted in an inaccessible project.
do $$ begin
 begin
  update public.tasks set owner_id='af000000-0000-4000-8000-000000000003' where id='af200000-0000-4000-8000-000000000002';
  raise exception 'Task ownership changed';
 exception when insufficient_privilege then null;
 end;
end $$;
do $$ begin
 begin
  update public.tasks set project_id='af100000-0000-4000-8000-000000000001' where id='af200000-0000-4000-8000-000000000002';
  raise exception 'Task planted in victim project';
 exception when insufficient_privilege then null;
 end;
end $$;
-- A collaborator cannot pull the owner's task out of the shared project.
do $$ begin
 begin
  update public.tasks set project_id='af100000-0000-4000-8000-000000000002' where id='af200000-0000-4000-8000-000000000003';
  raise exception 'Collaborator moved someone else''s task';
 exception when insufficient_privilege then null;
 end;
end $$;
-- Ordinary collaborative edits still work.
update public.tasks set name='Edited by collaborator' where id='af200000-0000-4000-8000-000000000003';
select pg_temp.check_access((select name from public.tasks where id='af200000-0000-4000-8000-000000000003')='Edited by collaborator', 'collaborator edit');

-- Direct sharing with a stranger becomes a pending invitation.
insert into public.project_members(project_id,user_id,status) values
 ('af100000-0000-4000-8000-000000000002','af000000-0000-4000-8000-000000000003','accepted');
-- Direct sharing with an existing collaborator stays accepted.
insert into public.project_members(project_id,user_id,status) values
 ('af100000-0000-4000-8000-000000000002','af000000-0000-4000-8000-000000000001','accepted');
select pg_temp.reset_actor();
reset role;
select pg_temp.check_access((select status from public.project_members where project_id='af100000-0000-4000-8000-000000000002' and user_id='af000000-0000-4000-8000-000000000003')='pending', 'stranger needs consent');
select pg_temp.check_access((select status from public.project_members where project_id='af100000-0000-4000-8000-000000000002' and user_id='af000000-0000-4000-8000-000000000001')='accepted', 'collaborator shared directly');
set local role authenticated;

-- The owner cannot accept on the invitee's behalf; the invitee can.
select pg_temp.act_as('af000000-0000-4000-8000-000000000002');
do $$ begin
 begin
  update public.project_members set status='accepted'
  where project_id='af100000-0000-4000-8000-000000000002' and user_id='af000000-0000-4000-8000-000000000003';
  raise exception 'Owner accepted for invitee';
 exception when insufficient_privilege then null;
 end;
end $$;
select pg_temp.act_as('af000000-0000-4000-8000-000000000003');
do $$ begin
 begin
  update public.project_members set role='owner'
  where project_id='af100000-0000-4000-8000-000000000002' and user_id='af000000-0000-4000-8000-000000000003';
  raise exception 'Invitee changed role';
 exception when insufficient_privilege then null;
 end;
end $$;
update public.project_members set status='accepted', accepted_at=now()
where project_id='af100000-0000-4000-8000-000000000002' and user_id='af000000-0000-4000-8000-000000000003';
select pg_temp.check_access(public.can_access_project('af100000-0000-4000-8000-000000000002'), 'invitee accepted');

-- API tokens: no direct inserts, RPC works for sessions, rejected for MCP OAuth.
do $$ begin
 begin
  insert into public.api_tokens(owner_id,token_hash,token_prefix)
  values ('af000000-0000-4000-8000-000000000003', repeat('a',64), 'tk_aaaaa');
  raise exception 'Direct API token insert allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
select pg_temp.check_access((select raw_token like 'tk_%' and length(raw_token)=67 and token_prefix=left(raw_token,8) from public.create_api_token('Integration')), 'session creates token');
select pg_temp.act_as('af000000-0000-4000-8000-000000000003', '{"client_id":"mcp-client","tickist_mcp":true}');
do $$ begin
 begin
  perform public.create_api_token('From MCP');
  raise exception 'MCP OAuth token minted an API token';
 exception when insufficient_privilege then null;
 end;
end $$;

-- MCP audit rows: insert is normalised, completion allowed once, no rewrites.
insert into public.mcp_audit_events(owner_id,client_id,tool_name,request_id,outcome,finished_at)
values ('af000000-0000-4000-8000-000000000003','forged','create_task','req-1','succeeded',now());
select pg_temp.check_access((select outcome='started' and finished_at is null and client_id='mcp-client' from public.mcp_audit_events where request_id='req-1'), 'audit insert normalised');
update public.mcp_audit_events set outcome='succeeded' where request_id='req-1';
do $$ begin
 begin
  update public.mcp_audit_events set outcome='failed', tool_name='other' where request_id='req-1';
  raise exception 'Audit row rewritten';
 exception when insufficient_privilege then null;
 end;
end $$;

select pg_temp.reset_actor();
reset role;
select pg_temp.check_access(not has_function_privilege('authenticated', 'public.find_auth_user_id_by_email(text)', 'execute'), 'no authenticated email lookup');
select pg_temp.check_access(not has_function_privilege('anon', 'public.create_api_token(text)', 'execute'), 'no anonymous token creation');
select pg_temp.check_access(public.find_auth_user_id_by_email(' Access-Owner@example.invalid ')='af000000-0000-4000-8000-000000000001', 'email lookup is case-insensitive');

rollback;
