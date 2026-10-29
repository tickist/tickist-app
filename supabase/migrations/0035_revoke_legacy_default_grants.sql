-- Older Supabase projects granted every Data API role full privileges on new
-- public tables. Align existing databases with a rebuilt schema: anonymous
-- clients only read published legal documents, and browser users keep the
-- row operations that RLS policies evaluate.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
grant select on public.legal_releases to anon;

revoke truncate, references, trigger on all tables in schema public from authenticated;
revoke update on all sequences in schema public from authenticated;
-- Migrations 0018 and 0023 never granted these deletes and no policy allows them.
revoke delete on public.workspaces, public.mcp_audit_events from authenticated;

do $$
begin
  if current_setting('server_version_num')::integer >= 170000 then
    execute 'revoke maintain on all tables in schema public from authenticated';
  end if;
end;
$$;
