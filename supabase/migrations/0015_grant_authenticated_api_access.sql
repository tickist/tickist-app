-- RLS policies decide which rows an authenticated user can access. The API role
-- also needs table and sequence privileges before PostgREST can evaluate them.
grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
on all tables in schema public
to authenticated;

grant usage, select
on all sequences in schema public
to authenticated;

grant all privileges
on all tables in schema public
to service_role;

grant all privileges
on all sequences in schema public
to service_role;
