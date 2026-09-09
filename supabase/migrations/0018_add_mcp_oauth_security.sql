create table if not exists public.mcp_audit_events (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null default 'stdio',
  tool_name text not null,
  target_type text,
  target_id uuid,
  request_id text not null,
  outcome text not null default 'started'
    check (outcome in ('started', 'succeeded', 'failed')),
  error_code text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.mcp_audit_events enable row level security;

drop policy if exists mcp_audit_events_select_owner
  on public.mcp_audit_events;
create policy mcp_audit_events_select_owner
  on public.mcp_audit_events
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists mcp_audit_events_insert_owner
  on public.mcp_audit_events;
create policy mcp_audit_events_insert_owner
  on public.mcp_audit_events
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists mcp_audit_events_update_owner
  on public.mcp_audit_events;
create policy mcp_audit_events_update_owner
  on public.mcp_audit_events
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create index if not exists mcp_audit_events_owner_created_idx
  on public.mcp_audit_events(owner_id, created_at desc);

grant select, insert, update on table public.mcp_audit_events
  to authenticated;

create or replace function public.tickist_mcp_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb;
begin
  claims := event->'claims';
  -- Tickist's Supabase OAuth server is reserved for MCP clients. The
  -- client_id guard keeps ordinary browser/session tokens unchanged.
  if claims->>'client_id' is not null then
    claims := jsonb_set(
      claims,
      '{aud}',
      to_jsonb('https://mcp.tickist.com/mcp'::text)
    );
    claims := jsonb_set(claims, '{tickist_mcp}', 'true'::jsonb);
    claims := jsonb_set(
      claims,
      '{tickist_mcp_scopes}',
      '[
        "projects:read",
        "projects:write",
        "tasks:read",
        "tasks:write",
        "tags:read",
        "tags:write"
      ]'::jsonb
    );
    event := jsonb_set(event, '{claims}', claims);
  end if;
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.tickist_mcp_access_token_hook(jsonb)
  to supabase_auth_admin;
revoke execute on function public.tickist_mcp_access_token_hook(jsonb)
  from public, anon, authenticated;
