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
  -- Supabase Auth and PostgREST require their standard authenticated audience.
  -- The MCP resource audience remains present for RFC 9728 token validation.
  if claims->>'client_id' is not null then
    claims := jsonb_set(
      claims,
      '{aud}',
      jsonb_build_array(
        'authenticated',
        'https://mcp.tickist.com/mcp'
      )
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
