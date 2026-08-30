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
| `tickist-mcp`                | Provides the server-side MCP integration surface for authorised clients.                                                                 | MCP Streamable HTTP with Supabase JWT or personal Bearer-token authentication.               |

## Invocation rules

- Use `POST` for function work; CORS `OPTIONS` is supported where a browser-facing endpoint needs it.
- Internal workers require `x-internal-function-secret` and must never be exposed as unauthenticated browser actions.
- User-facing functions validate the Supabase Bearer token and derive identity from it rather than trusting a user ID supplied in the request body.
- Keep secrets in Supabase Edge Function secrets and GitHub deployment secrets. Do not add them to `/env.js`, Angular configuration, tests, or public documentation.

## MCP protocol contract

The private `POST /mcp` endpoint is a Cloudflare Worker proxy to the `tickist-mcp` Edge Function. It implements the stable MCP `2026-07-28` Streamable HTTP protocol and retains initialization-based `2025-06-18` compatibility for existing clients.

Modern clients are stateless. Every request must include the `2026-07-28` protocol version and client capabilities in `params._meta`, plus matching `MCP-Protocol-Version` and `Mcp-Method` HTTP headers. `tools/call` also requires a matching `Mcp-Name`. The server implements `server/discover`, advertises only the modern `2026-07-28` revision there, returns `resultType: "complete"`, includes cache metadata where required, and uses the standard header-mismatch and unsupported-version errors. Legacy compatibility is negotiated separately: those clients continue to use `initialize` and `notifications/initialized` before listing or calling tools.

The endpoint exposes a deterministic catalogue of project, task, and tag tools. Object-shaped tool results include both text content and structured JSON content; array results remain text JSON for compatibility with the legacy structured-content contract. Requests and tool arguments are validated before any handler runs. The Worker and Edge Function reject untrusted `Origin` values, enforce JSON requests and the body-size limit, and preserve MCP routing headers through the proxy. Personal API tokens are created in authenticated settings, sent as Bearer credentials, and restricted by their stored `projects:*`, `tasks:*`, and `tags:*` scopes; they are not browser runtime configuration. Because the function uses a server-side Supabase credential, task project references are independently checked against project ownership or accepted membership before writes. Database diagnostics remain in server logs rather than tool responses. OAuth discovery and dynamic client registration are not provided by this endpoint.

The production workflow deploys both the `tickist-mcp` Supabase Edge Function and the Cloudflare `tickist-app` Worker. Its final route smoke test requires `https://tickist.com/mcp` to return an unauthenticated Bearer challenge and reject an untrusted browser origin. Production runs on `master` pushes or manual workflow dispatch; a `develop` push alone does not deploy either worker.

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
