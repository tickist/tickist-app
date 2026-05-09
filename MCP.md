# Tickist MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that lets AI assistants manage your Tickist tasks, projects, and tags.

## Features

- **13 tools**: Full CRUD for tasks, projects, and tags
- **Dual authentication**: OAuth 2.0 (ChatGPT) + Bearer API tokens (Codex/CLI)
- **Deployed as**: Supabase Edge Function, proxied through `tickist.com/mcp`
- **Protocol**: MCP 2025-06-18 over Streamable HTTP

## Endpoint

**Production** (preferred):
```
POST https://tickist.com/mcp
```

**Direct Supabase** (alternative):
```
POST https://<your-project>.supabase.co/functions/v1/tickist-mcp
```

**Local development**:
```
POST http://localhost:54321/functions/v1/tickist-mcp
```

---

## Authentication

### Option A: Supabase JWT (OAuth / ChatGPT)

Use a Supabase access token obtained through the standard OAuth flow:

```
Authorization: Bearer <supabase-access-token>
```

ChatGPT and similar AI clients authenticate users through Supabase Auth's OAuth server. The user logs in via the Tickist login page, and the resulting JWT is used to authenticate MCP requests.

### Option B: Personal API Token (Codex / CLI)

Generate a personal API token from **Settings → API Tokens** in the Tickist app, then use it as a Bearer token:

```
Authorization: Bearer <personal-api-token>
```

Tokens are hashed (SHA-256) before storage. The raw value is shown once at creation — copy it immediately.

---

## Available Tools

### Projects

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects (filter: `is_active`) |
| `get_project` | Get project by ID |
| `create_project` | Create project (name, description, color, icon) |
| `update_project` | Update project fields |

### Tasks

| Tool | Description |
|------|-------------|
| `list_tasks` | List tasks (filter: project, status, priority; limit) |
| `get_task` | Get task with steps and tags |
| `create_task` | Create task (auto-assigns to inbox if no project) |
| `update_task` | Update task fields |
| `complete_task` | Mark done or reopen |
| `delete_task` | Permanently delete |

### Tags

| Tool | Description |
|------|-------------|
| `list_tags` | List all tags |
| `create_tag` | Create a new tag |
| `add_tag_to_task` | Associate a tag with a task |

---

## Usage Examples

### Initialize session

```bash
curl -X POST https://tickist.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": { "name": "test-client", "version": "1.0" }
    }
  }'
```

### List tools

```bash
curl -X POST https://tickist.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

### Create a task

```bash
curl -X POST https://tickist.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "create_task",
      "arguments": {
        "name": "Buy groceries",
        "priority": "high",
        "finish_date": "2026-03-15"
      }
    }
  }'
```

---

## Connecting to ChatGPT

1. Enable Supabase OAuth server in `config.toml`
2. Register Tickist as a ChatGPT action:
   - **MCP endpoint**: `https://tickist.com/mcp`
   - **Auth type**: OAuth 2.0
3. Users log in via Tickist's Supabase auth page

## Connecting to Codex

Add to your MCP client config:

```json
{
  "mcpServers": {
    "tickist": {
      "url": "https://tickist.com/mcp",
      "headers": {
        "Authorization": "Bearer <your-api-token>"
      }
    }
  }
}
```

---

## Security

- **CORS**: Restricted to `tickist.com` and `localhost:4200` origins
- **Body size limit**: 64 KB maximum per request
- **Token storage**: SHA-256 hashed, raw value never stored
- **Ownership checks**: Every query filters by authenticated `owner_id`
- **Service role**: Used internally; all access scoped to the authenticated user
- **RLS**: Database-level row security policies also enforced

---

## Development

```bash
# Serve locally
npx supabase functions serve tickist-mcp --env-file .local_env

# Deploy
npx supabase functions deploy tickist-mcp

# Apply api_tokens migration
npm run db:push:local
```
