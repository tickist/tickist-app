# Operator account deletion

Account deletion is requested by email at `remove-account@tickist.com`. Settings opens that address; it does not claim immediate self-service erasure. The operator verifies the requester and executes the server-side CLI. There is no browser-accessible administrative deletion endpoint.

## Before applying

1. Verify that the requester controls the account. A matching From header alone is not proof: use a reply/challenge to the registered address and resolve any identity discrepancy. Never request a password or token by email.
2. Determine the exact Auth user UUID in the intended Supabase project. Offer the existing export before deleting. Review sharing with the requester; do not erase another person's work to bypass a blocker.
3. Install migration `0024_account_deletion.sql` through the normal migration workflow. Do not use this guide to approve a production deployment.
4. Pause notification producers and email delivery during the operation and let already claimed sends finish. The database cannot retract a message already handed to AWS. Resume afterward. Avoid other administrative writes during deletion.
5. Keep an access-controlled, minimal record of the verified request and deletion, including the UUID needed to reapply deletion after restoring a backup. This record belongs outside Git; define its own retention separately. Do not record task contents or credentials.

## Preview and execution

Node 24 and installed dependencies are required. The CLI uses the installed Supabase SDK. A preview connects to the selected project read-only; it prints counts and blocker codes, not account email or task contents. No credentials are passed as CLI arguments.

```bash
# Help needs no credentials or connection.
npm run account:delete -- --help

# Local preview; the environment must include a local server-side secret.
npx dotenv -e .local_env -- npm run account:delete -- --user-id=USER_UUID

# Remote preview. .env must contain the intended URL, project ref and secret.
npx dotenv -e .env -- npm run account:delete -- --user-id=USER_UUID

# Irreversible remote execution after reviewing the preview and request.
npx dotenv -e .env -- npm run account:delete -- \
  --user-id=USER_UUID --apply --confirm-user-id=USER_UUID \
  --confirm-project=PROJECT_REF
```

Required variables: `NG_APP_SUPABASE_URL` (or `SUPABASE_URL`), `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`), and for remote targets `SUPABASE_PROJECT_REF`. Local apply uses `--confirm-project=local` and accepts only `http://localhost:54321` or `http://127.0.0.1:54321`. Remote targets must be exact HTTPS Supabase project origins. The tool intentionally has no implicit apply or force mode.

## Blockers and scope

- `shared_work_requires_review`: owned projects with other members (including invitations), cross-owner project/task relationships, cross-owner project nesting, or owned tasks assigned to others. Resolve deliberately with those affected. A blocker requires operator follow-up, not indefinite refusal of a deletion request.
- `migration_audit_requires_review`: the legacy arbitrary JSON store is nonempty. It has no dependable account key, so it needs a reviewed cleanup/classification before automated deletion can proceed. Never clear the whole table just to bypass this guard.
- `email_delivery_in_progress`: an affected email is currently claimed. Finish or resolve the send with the worker paused; do not race it.
- `unexpected_storage_requires_review`: an owned object is outside the known avatar directory. Inspect it without exposing contents in logs.

The tool removes files under the exact `avatars/USER_UUID/` prefix through the Storage API, rechecks the preview, and calls Auth hard deletion (`deleteUser(uuid, false)`). It verifies the specific Auth `user_not_found` result afterward. Storage metadata must not be deleted directly through SQL.

An Auth deletion trigger rechecks blockers under database locks and removes emails addressed to the account or associated with its UUID in the dedupe key, plus activity rows owned by the account or tied to its owned tasks/projects. Existing foreign keys remove profiles, workspaces, projects, owned tasks and their steps/tags, personal tokens, MCP audit events, memberships, assignments, reminders and notification preferences/notifications. Auth manages its sessions, identities and grants; integration verification should cover the installed Auth version. Author/editor references on other people's surviving work become null.

The Inbox deletion guard still rejects direct Inbox removal while its Auth owner exists; it allows account-deletion cascades. A restrictive Storage policy requires an existing Auth account for authenticated avatar operations, including with an otherwise unexpired JWT. Deleting Auth does not cryptographically expire every issued JWT; authorization must continue to depend on live account/data access. Public avatar URLs may remain cached until caches expire.

## Failures and limits

Storage and Auth are separate systems. An error after file cleanup can leave the account present with its avatar removed. The CLI exits unsuccessfully and says so. Reinspect before retrying; do not report completion on a timeout or an unexpected verification error. The transactional database trigger prevents partial application-row cleanup on an Auth deletion failure.

This operation does not erase backups, provider security logs, existing browser caches/exports, received email, Gmail correspondence, or account references freely typed inside another person's task content. Review those separately when fulfilling a request; do not claim that all copies were instantly erased. The agreed backup maximum is 30 days, but automated retention remains a separate unimplemented task. Reapply deletions before reopening a restored backup to users.

## Verification

```bash
npm run account:delete:test
```

`tools/account-deletion/account-deletion.integration.sql` uses synthetic accounts within a transaction and rolls back. Run it only against local Supabase with all migrations applied, using `psql -v ON_ERROR_STOP=1`; never point it at the remote database. It checks RPC permissions, shared-data blockers, Inbox protection and cascades, cleanup of email/activity/token records, surviving unrelated data, and stale-account Storage authorization.

The SDK behavior is based on [Supabase user management](https://supabase.com/docs/guides/auth/managing-user-data) and [Auth admin deletion](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser). Backups and request correspondence require their own operational follow-up.
