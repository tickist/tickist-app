# Demo data seeding

Tickist has a repository-managed, deterministic English demo dataset for screenshots, product demonstrations, articles, and presentations. It is an operator tool, not an application feature or a general production seed.

## Dataset

Dataset version `2026-07-v1` belongs to one dedicated marked account:

| User      | Email              | Persona                                     |
| --------- | ------------------ | ------------------------------------------- |
| Maya Chen | `demo@tickist.com` | 34, Mountain View, California, English (US) |

The dataset contains exactly 30 projects including Inbox, 200 tasks including 40 completed tasks, 12 tags, task-tag relations, assignees, subtasks, reminders, and notifications. Projects and tasks cover product leadership, engineering, friends, health, Bay Area life, travel, learning, volunteering, household work, and weekly routines. Stable keys and deterministic dates make every dry run for the same version identical.

The initial password comes from `DEMO_SEED_INITIAL_PASSWORD`. It is needed only when the account must be created or replaced. A normal synchronization does not reset a password changed later.

## Dry run

Dry run is the default. It validates and summarizes the dataset without loading credentials or connecting to Supabase:

```bash
npm run demo:seed
npm run demo:seed:test
```

## Configuration and local apply

Copy `.env.demo.example` to the ignored `.env.demo.local`. Shared remote Supabase values remain in the ignored `.env`:

```text
NG_APP_SUPABASE_URL
SUPABASE_PROJECT_REF
SUPABASE_SECRET_KEY
```

For the local stack, load `.local_env` explicitly and use the service-role secret reported by `npx supabase status -o env`:

```bash
dotenv -e .local_env -e .env.demo.local -- \
  npm run demo:seed -- --apply
```

Local writes still require `--apply`. Tickist recognizes only the exact local API origin `http://127.0.0.1:54321` or its `localhost` equivalent.

## Remote synchronization

Run a dry run first. Remote writes require three matching project confirmations:

```bash
npm run demo:seed:apply -- \
  --allow-remote \
  --confirm-project-ref=YOUR_PROJECT_REF
```

The command checks that the API URL and `SUPABASE_PROJECT_REF` identify the same project. It refuses an existing `demo@tickist.com` account unless Auth metadata marks it with the expected Tickist demo seed ID and English locale.

The default `sync` mode preserves the marked Auth identity and password, preserves the protected Inbox identity, and deterministically rebuilds the demo account's project and task data. It verifies the final project, task, completion, tag, and reminder counts. The REST writes cannot form one cross-request transaction, but the deterministic operation is safe to rerun after interruption.

## Replace

Replacement deletes and recreates the marked Auth identity and all cascading data. It requires the exact demo email as a second confirmation:

```bash
npm run demo:seed:apply -- \
  --mode=replace \
  --allow-remote \
  --confirm-project-ref=YOUR_PROJECT_REF \
  --confirm-replace=demo@tickist.com
```

Use `sync` for normal refreshes. Use `replace` only when the Auth identity or initial password must change.

## Extending the dataset

When the Tickist data model changes, update the generator and runner, increment `DATASET_VERSION`, extend the safety tests, and apply the seed twice to a local stack to prove synchronization remains idempotent. Never weaken the Auth metadata marker or remote project confirmation checks.
