# Architecture and boundaries

## Application layout

- `apps/tickist-web/` is the Angular 21 standalone application.
- `apps/tickist-web-e2e/` is the Playwright suite.
- `supabase/migrations/` contains ordered database migrations.
- `supabase/functions/` contains Deno-based Edge Functions.
- `apps/tickist-web/worker.ts` is the Cloudflare Worker used in production.
- `apps/mcp/` is the dedicated HTTP and STDIO MCP server.
- `libs/data-access/tickist/` is its user-token Supabase data layer.

The frontend is organised around `auth`, `app-shell`, `blog`, `dashboard`, `tags`, `task-fab`, `team`, `tree-view`, `statistics`, `core`, and `data`.

## Frontend

The application uses Angular standalone components and signals first. RxJS is used where stream integration is appropriate. Styling combines Tailwind CSS, DaisyUI, and component CSS. Use built-in Angular control flow (`@if`, `@for`, `@switch`) rather than structural directive syntax.

The browser reads public runtime configuration from `/env.js` in production. Only public Supabase configuration belongs there: `NG_APP_SUPABASE_URL`, `NG_APP_SUPABASE_PUBLISHABLE_KEY`, and optionally `NG_APP_SUPABASE_FUNCTIONS_URL`.

## Supabase data model

Supabase owns authentication and the relational data model. Core tables include:

- `projects`, `project_members`;
- `tasks`, `task_steps`, `task_tags`, `task_assignees`, `task_reminders`;
- `tags`, `notifications`, `notification_preferences`, `routine_reminders`;
- `api_tokens`, `mcp_audit_events`, `email_outbox`, and activity/audit support tables.

Task activity is managed at the database level. A trigger updates `modification_date` on every task update and sets or clears `when_complete` when the completion state changes.

## Authorization

Row Level Security is mandatory. Browser requests use the authenticated Supabase role; policies decide whether a user may read or mutate a row. SQL grants allow the API role to reach the tables, but RLS remains the row-level decision point. Do not bypass these boundaries by adding broad client-side secrets or service-role credentials to the app.

The `list_accessible_project_assignees` security-definer function exposes only user IDs and display labels for owners and accepted members of projects available to the current user. It does not expose Auth records or profile preferences to the browser.

## Server-side automation

Edge Functions handle reminders, shared-project updates, invitations, notification digests, outbox enqueueing, email delivery, and routines. The old `tickist-mcp` function remains only as a temporary bridge for hashed personal tokens. Sensitive functions use `INTERNAL_FUNCTION_SECRET`, a validated user JWT, or a hashed personal API token as appropriate. AWS SES credentials remain in Edge Function secrets.

## Cloudflare deployment

Two Workers are deployed independently. `tickist-app` serves SPA assets and runtime configuration; its old `/mcp` route proxies to the MCP hostname during the compatibility period. `tickist-mcp` serves `mcp.tickist.com`, validates Host, Origin, body and Bearer credentials, and exposes health plus OAuth metadata. A dedicated Cloudflare Rate Limiting binding allows 120 MCP POST requests per minute per hashed connecting address; unverified Bearer values never select rate-limit buckets. Its official SDK server sends the user's token to Supabase through the publishable key, leaving project and task access to RLS. It never receives a service-role key.

Supabase Auth is the OAuth 2.1 authorization server and is reserved for MCP clients in this project. Supabase currently accepts standard identity scopes, so clients request `openid`; the configured access-token hook marks OAuth client tokens with both the standard `authenticated` audience and the exact MCP resource audience, `tickist_mcp = true`, and a signed `tickist_mcp_scopes` claim containing the project, task, and tag tool permissions. Ordinary browser/session tokens have no `client_id` and remain unchanged. The Angular app owns the noindex consent and grant-management screens. The MCP Worker owns RFC 9728 resource metadata, verifies the JWT signature against Supabase Auth signing keys, and then checks issuer, MCP audience, expiry, subject, and both MCP claims before data access. Supabase PostgREST applies user-scoped RLS to every data operation.

SPA fallback remains enabled for application routes. For public blog indexes, the app Worker injects locale-specific title, description, canonical, robots, Open Graph, Twitter-card, and JSON-LD metadata. It adds `X-Robots-Tag: noindex, nofollow` to `/auth/**` and `/app/**`; the dedicated MCP Worker adds the same header to health, metadata, and protocol responses. Technical MCP and OAuth routes must never enter the sitemap.
