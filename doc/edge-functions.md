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
| `tickist-mcp`                | Provides the server-side MCP integration surface for authorised API-token clients.                                                       | MCP protocol and API-token authentication.                                                   |

## Invocation rules

- Use `POST` for function work; CORS `OPTIONS` is supported where a browser-facing endpoint needs it.
- Internal workers require `x-internal-function-secret` and must never be exposed as unauthenticated browser actions.
- User-facing functions validate the Supabase Bearer token and derive identity from it rather than trusting a user ID supplied in the request body.
- Keep secrets in Supabase Edge Function secrets and GitHub deployment secrets. Do not add them to `/env.js`, Angular configuration, tests, or public documentation.

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
