# Edge Functions

Tickist Edge Functions live in `supabase/functions/`. They are server-side integration points, not browser business logic. Each function must validate its caller and request shape before reading or changing data.

| Function                     | What it does                                                                                                                             | Access model                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `task-reminder`              | Handles a task lifecycle event (`created`, `completed`, or `snoozed`) and creates in-app notification work for eligible project members. | Server-triggered request; validates event payload.                                           |
| `task-reminder-runner`       | Processes scheduled task reminders, transitions reminder delivery states, and queues delivery work.                                      | Internal scheduled request protected by `INTERNAL_FUNCTION_SECRET`.                          |
| `routine-runner`             | Processes due routine-reminder entries and writes the resulting notification work.                                                       | Internal scheduled request protected by `INTERNAL_FUNCTION_SECRET`.                          |
| `project-update`             | Notifies accepted collaborators when a shared project is added or removed.                                                               | Server-triggered request; validates project event and message fields.                        |
| `project-invite`             | Creates, accepts, or declines project invitations and manages membership state.                                                          | Authenticated user request with a Bearer token.                                              |
| `notification-digest-runner` | Reads daily/weekly notification preferences, builds due digests, and enqueues email through the outbox.                                  | Internal scheduled request protected by `INTERNAL_FUNCTION_SECRET`.                          |
| `enqueue-notification`       | Lets an authenticated user enqueue one application email without choosing another recipient's address.                                   | Authenticated user request with a Bearer token; recipient comes from the authenticated user. |
| `send-emails`                | Claims queued outbox records, sends them through AWS SES, applies retry/backoff policy, and marks terminal states.                       | Internal scheduled request protected by `INTERNAL_FUNCTION_SECRET`.                          |
| `tickist-mcp`                | Temporary compatibility backend for existing hashed personal API tokens while clients move to the dedicated MCP Worker.                  | Scoped personal Bearer-token authentication; not the primary OAuth MCP runtime.              |

## Invocation rules

- Use `POST` for function work; CORS `OPTIONS` is supported where a browser-facing endpoint needs it.
- Internal workers require `x-internal-function-secret` and must never be exposed as unauthenticated browser actions.
- User-facing functions validate the Supabase Bearer token and derive identity from it rather than trusting a user ID supplied in the request body.
- Keep secrets in Supabase Edge Function secrets and GitHub deployment secrets. Do not add them to `/env.js`, Angular configuration, tests, or public documentation.

## MCP protocol contract

The only public MCP endpoint is `https://mcp.tickist.com/mcp`, served by the dedicated `tickist-mcp` Cloudflare Worker from `apps/mcp`. The main application Worker does not expose or proxy `/mcp`. Both modern stateless MCP `2026-07-28` and initialization-based `2025-06-18` clients use the same official TypeScript SDK server definition. STDIO uses that definition through `apps/mcp/src/main.ts`.

Modern clients are stateless. Every request must include the `2026-07-28` protocol version and client capabilities in `params._meta`, plus matching `MCP-Protocol-Version` and `Mcp-Method` HTTP headers. `tools/call` also requires a matching `Mcp-Name`. The server implements `server/discover`, advertises only the modern `2026-07-28` revision there, returns `resultType: "complete"`, includes cache metadata where required, and uses the standard header-mismatch and unsupported-version errors. Legacy compatibility is negotiated separately: those clients continue to use `initialize` and `notifications/initialized` before listing or calling tools.

The endpoint exposes a deterministic catalogue of project, task, and tag tools. Object-shaped tool results include text content and structured JSON content; array results remain text JSON for compatibility. Requests and tool arguments are validated before handlers run. The Worker rejects untrusted `Host` and `Origin` values, requires strict UTF-8 JSON, measures the body limit independently of `Content-Length`, returns `X-Robots-Tag: noindex, nofollow`, and never logs credentials or user payloads. Its separate Cloudflare Rate Limiting binding permits 120 MCP POST requests per minute per SHA-256 hash of the Cloudflare connecting address. The pre-authentication limiter never trusts an unverified Bearer value as a bucket key.

OAuth 2.1 authorization-code access uses PKCE through Supabase Auth. The access-token hook preserves Supabase's `authenticated` audience for Auth and PostgREST while adding the exact MCP resource audience. The Worker publishes RFC 9728 protected-resource metadata and authorization-server metadata, cryptographically verifies access-token signatures against Supabase Auth signing keys, then accepts tokens only when issuer, MCP audience, expiry, subject, `tickist_mcp`, and the signed `tickist_mcp_scopes` claim checks pass. It forwards the user's Bearer token to Supabase PostgREST, where RLS remains the data-authorization boundary. The browser consent route is `/auth/oauth/consent`; connected grants are listed and revoked at `/app/settings/connected-apps`. Supabase dynamic client registration remains enabled for client compatibility.

Tickist reserves its Supabase OAuth server for MCP integrations. Supabase currently supports only the standard identity scopes, so MCP clients request `openid`; the access-token hook grants the complete six-scope Tickist tool set in `tickist_mcp_scopes`. Tool handlers still enforce their required project, task, and tag permissions, including both `tasks:write` and `tags:write` for assigning a tag. Existing personal tokens retain their independently selected `projects:*`, `tasks:*`, and `tags:*` scopes.

OAuth operations use the public Supabase publishable key and user token, so database RLS is the authorization boundary for owners and accepted project members. The dedicated Worker has no service-role credential. Mutation attempts create user-owned `mcp_audit_events` records without storing arguments, tokens, or returned data.

Existing `tk_` personal tokens remain available in settings. Because they are stored as one-way hashes and are not Supabase JWTs, the dedicated Worker forwards only those credentials to the old Edge Function until a separate token migration or rotation is approved. Do not develop two independent MCP catalogues: the Edge Function is a compatibility bridge and must be retired after that transition.

The production workflow configures and verifies the OAuth server, dynamic registration, consent path, and custom access-token hook after migrations. It temporarily deploys the personal-token compatibility Edge Function, then deploys the `tickist-app` and `tickist-mcp` Cloudflare Workers separately. The authenticated MCP smoke sequence is temporarily disabled by default and does not gate deployment. Setting the GitHub Actions repository variable `ENABLE_MCP_OAUTH_SMOKE=true` enables dynamic public-client registration, authorization code with S256 PKCE and explicit consent through a dedicated test user, modern and legacy requests with the fresh OAuth JWT, the optional `MCP_PERSONAL_SMOKE_TOKEN` compatibility check, and smoke-grant revocation. Smoke secrets are scoped only to those conditional steps. Production runs on `master` pushes or manual workflow dispatch; a `develop` push alone does not deploy either Worker.

## Delivery chain

```text
Task or preference change
  -> database record / notification preference
  -> scheduled runner or authenticated enqueue function
  -> public.email_outbox
  -> send-emails
  -> AWS SES
```

The outbox makes sending idempotent and observable. Failed delivery is retried only when appropriate; exhausted attempts become terminal rather than silently looping.
