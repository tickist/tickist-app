# Architecture and boundaries

## Application layout

- `apps/tickist-web/` is the Angular 21 standalone application.
- `apps/tickist-web-e2e/` is the Playwright suite.
- `supabase/migrations/` contains ordered database migrations.
- `supabase/functions/` contains Deno-based Edge Functions.
- `apps/tickist-web/worker.ts` is the Cloudflare Worker used in production.

The frontend is organised around `auth`, `app-shell`, `blog`, `dashboard`, `tags`, `task-fab`, `team`, `tree-view`, `statistics`, `core`, and `data`.

## Frontend

The application uses Angular standalone components and signals first. RxJS is used where stream integration is appropriate. Styling combines Tailwind CSS, DaisyUI, and component CSS. Use built-in Angular control flow (`@if`, `@for`, `@switch`) rather than structural directive syntax.

The browser reads public runtime configuration from `/env.js` in production. Only public Supabase configuration belongs there: `NG_APP_SUPABASE_URL`, `NG_APP_SUPABASE_PUBLISHABLE_KEY`, and optionally `NG_APP_SUPABASE_FUNCTIONS_URL`.

## Supabase data model

Supabase owns authentication and the relational data model. Core tables include:

- `projects`, `project_members`;
- `tasks`, `task_steps`, `task_tags`, `task_assignees`, `task_reminders`;
- `tags`, `notifications`, `notification_preferences`, `routine_reminders`;
- `api_tokens`, `email_outbox`, and activity/audit support tables.

Task activity is managed at the database level. A trigger updates `modification_date` on every task update and sets or clears `when_complete` when the completion state changes.

## Authorization

Row Level Security is mandatory. Browser requests use the authenticated Supabase role; policies decide whether a user may read or mutate a row. SQL grants allow the API role to reach the tables, but RLS remains the row-level decision point. Do not bypass these boundaries by adding broad client-side secrets or service-role credentials to the app.

## Server-side automation

Edge Functions handle reminders, shared-project updates, invitations, notification digests, outbox enqueueing, email delivery, routines, and MCP integration. Sensitive functions use `INTERNAL_FUNCTION_SECRET` or a validated user JWT as appropriate. AWS SES credentials remain in Edge Function secrets.

## Cloudflare deployment

The Worker serves built SPA assets, runtime configuration, and the dedicated `/mcp` endpoint. SPA fallback is enabled for application routes. For the public blog indexes (`/en/blog` and `/pl/blog`), it injects locale-specific title, description, canonical, robots, Open Graph, Twitter-card, and JSON-LD metadata into the initial HTML response. The Worker must not turn private API or workspace paths into indexable public content.
