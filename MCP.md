# Tickist MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that lets AI assistants manage your Tickist tasks, projects, tags, and task time tracking.

## Features

- **22 tools**: Tasks, projects, tags, and task time tracking
- **Dual authentication**: OAuth 2.1 (ChatGPT) + Bearer API tokens (Codex, Claude Code, other CLI clients)
- **Deployed as**: Dedicated Cloudflare Worker at `mcp.tickist.com`
- **Protocol**: MCP 2026-07-28 with 2025-06-18 compatibility

## Endpoint

**Production**:

```
POST https://mcp.tickist.com/mcp
```

**Local development**:

```
POST http://localhost:8787/mcp
```

---

## Authentication

### Option A: Supabase JWT (OAuth / ChatGPT)

Use a Supabase access token obtained through the standard OAuth flow:

```
Authorization: Bearer <supabase-access-token>
```

ChatGPT and similar AI clients authenticate users through Supabase Auth's OAuth server. The user logs in via the Tickist login page, and the resulting JWT is used to authenticate MCP requests.

### Option B: Personal API Token (Codex, Claude Code, CLI)

Generate a personal API token from **Settings → API Tokens** in the Tickist app, then use it as a Bearer token:

```
Authorization: Bearer <personal-api-token>
```

Tokens are hashed (SHA-256) before storage. The raw value is shown once at creation — copy it immediately.

---

## Available Tools

### Projects

| Tool              | Scope            | Description                                                       |
| ----------------- | ---------------- | ----------------------------------------------------------------- |
| `list_projects`   | `projects:read`  | List projects (filters: `is_active`, `ancestor_id`)               |
| `list_workspaces` | `projects:read`  | List workspaces                                                   |
| `get_project`     | `projects:read`  | Get project by ID                                                 |
| `create_project`  | `projects:write` | Create project, optionally nested                                 |
| `update_project`  | `projects:write` | Update project fields, including its parent                       |
| `delete_project`  | `projects:write` | Delete a non-Inbox project; tasks become unattached (destructive) |

### Tasks

| Tool            | Scope         | Description                                                            |
| --------------- | ------------- | ---------------------------------------------------------------------- |
| `list_tasks`    | `tasks:read`  | List tasks (filters: project with descendants, state, priority; limit) |
| `get_task`      | `tasks:read`  | Get task with steps and tags; `spent_minutes` is the total time        |
| `create_task`   | `tasks:write` | Create task (inbox when no project), optional recurrence               |
| `update_task`   | `tasks:write` | Update task fields; spent time is changed only through time entries    |
| `complete_task` | `tasks:write` | Mark done or reopen; recurring tasks advance                           |
| `suspend_task`  | `tasks:write` | Suspend indefinitely or until a future time                            |
| `resume_task`   | `tasks:write` | Resume a suspended task                                                |
| `delete_task`   | `tasks:write` | Permanently delete (destructive)                                       |

### Time tracking

Time tools reuse the task scopes. Dates are `YYYY-MM-DD` in the account timezone; ranges are inclusive and cover at most 367 days. Timestamps are ISO 8601 with an offset, for example `2026-11-05T09:30:00+01:00`.

| Tool                | Scope         | Description                                                                                                                 |
| ------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `get_time_report`   | `tasks:read`  | Minutes for `me` and `everyone` per group, task, and day; `group_by` is `project` (root project, default), `tag`, or `task` |
| `list_time_entries` | `tasks:read`  | Your own entries starting in a date range, newest first (optional `task_id`, `limit` up to 500, `has_more`)                 |
| `create_time_entry` | `tasks:write` | Add a finished entry: `task_id`, `started_at`, `ended_at`, optional `note` (500 characters)                                 |
| `update_time_entry` | `tasks:write` | Change an entry's task, start, end, or note (`time_entry_id`; `note: null` clears it)                                       |
| `delete_time_entry` | `tasks:write` | Delete one of your entries (destructive)                                                                                    |

Entries must end after they start, last at most 24 hours, not be in the future, and not overlap your other entries. In the tag report, a task with several of your tags appears under each tag and untagged tasks appear under "No tag", so group sums can exceed the overall total. A running timer counts up to now in the report and has `ended_at: null` in the entry list. A task's `spent_minutes` is maintained by the database from undated legacy minutes and finished entries.

### Tags

| Tool              | Scope                       | Description                 |
| ----------------- | --------------------------- | --------------------------- |
| `list_tags`       | `tags:read`                 | List all tags               |
| `create_tag`      | `tags:write`                | Create a new tag            |
| `add_tag_to_task` | `tasks:write`, `tags:write` | Associate a tag with a task |

Personal API tokens are currently served by a compatibility backend with the earlier project, task, and tag catalogue; time-tracking tools require OAuth.

---

## Usage Examples

### Initialize session

```bash
curl -X POST https://mcp.tickist.com/mcp \
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
curl -X POST https://mcp.tickist.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

### Create a task

```bash
curl -X POST https://mcp.tickist.com/mcp \
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
   - **MCP endpoint**: `https://mcp.tickist.com/mcp`
   - **Auth type**: OAuth 2.0
3. Users log in via Tickist's Supabase auth page

## Connecting to Codex, Claude Code, and other MCP clients

Any client that supports streamable HTTP MCP with a custom header works. Generic client config:

```json
{
  "mcpServers": {
    "tickist": {
      "url": "https://mcp.tickist.com/mcp",
      "headers": {
        "Authorization": "Bearer <your-api-token>"
      }
    }
  }
}
```

Claude Code:

```bash
claude mcp add --transport http tickist https://mcp.tickist.com/mcp \
  --header "Authorization: Bearer <your-api-token>"
```

Codex (`~/.codex/config.toml`):

```toml
[mcp_servers.tickist]
url = "https://mcp.tickist.com/mcp"
http_headers = { Authorization = "Bearer <your-api-token>" }
```

---

## Security

- **Origin and CORS**: A browser `Origin` must exactly match `https://` plus a configured MCP host on the default port; other origins are rejected before authentication
- **Body size limit**: 64 KB maximum per request, enforced while the body streams even without a valid `Content-Length`
- **Rate limits**: 120 POST requests per minute per connecting address (IPv6 grouped by /64) and, after OAuth verification, per user
- **Personal-token bridge**: Forwards only MCP request headers to an `https://` `LEGACY_MCP_URL` and never relays its CORS or cookie headers
- **Token storage**: SHA-256 hashed, raw value never stored
- **Ownership checks**: Every query filters by authenticated `owner_id`
- **Service role**: Not available to the MCP Worker
- **RLS**: Database-level row security policies also enforced

---

## Development

```bash
# Check the Cloudflare Worker bundle
npm run mcp:worker:check

# Run the dedicated Worker locally
npm exec wrangler -- dev --config wrangler.mcp.toml

# Deploy the dedicated Worker
npm run mcp:worker:deploy

# Apply api_tokens migration
npm run db:push:local
```
