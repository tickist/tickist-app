-- Personal API tokens for MCP / Codex integrations.
-- Tokens are stored as SHA-256 hashes; the raw value is shown once at creation.

create table if not exists public.api_tokens (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'API Token',
  token_hash text not null unique,
  token_prefix text not null,
  scopes text[] not null default array['tasks:read','tasks:write','projects:read','projects:write','tags:read','tags:write'],
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists api_tokens_owner_idx on public.api_tokens (owner_id);
create index if not exists api_tokens_hash_idx on public.api_tokens (token_hash);

-- RLS
alter table public.api_tokens enable row level security;

drop policy if exists api_tokens_select_own on public.api_tokens;
create policy api_tokens_select_own
  on public.api_tokens
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists api_tokens_insert_own on public.api_tokens;
create policy api_tokens_insert_own
  on public.api_tokens
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists api_tokens_delete_own on public.api_tokens;
create policy api_tokens_delete_own
  on public.api_tokens
  for delete
  to authenticated
  using (owner_id = auth.uid());
