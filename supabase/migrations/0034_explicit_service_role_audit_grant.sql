-- Supabase no longer grants Data API roles access to new public tables by
-- default. Migration 0018 granted only the authenticated role, so a rebuilt
-- database would leave service_role without access to MCP audit records.
grant all on public.mcp_audit_events to service_role;
