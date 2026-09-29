# Application history retention

Migration `0025_application_retention.sql` schedules daily cleanup at 03:37 UTC. It removes notifications older than 180 days (including unread), pending invitations older than 30 days, declined invitations 30 days after rejection, and MCP/activity history older than 90 days. The first successful scheduled run also processes existing expired history. It does not remove accounts, tasks, projects, accepted memberships, active reminders, or migration_audit.

Pending invitations cannot be accepted after 30 days, even before the scheduled cleanup. Legacy missing timestamps start their window at rollout. New invitations after expiry/rejection get a new invitation identifier for email deduplication. Repeating a current pending invitation does not extend its lifetime or enqueue another notification/email. Deploy the migration before the updated project-invite Edge Function.

`purge_application_history()` is accessible only to the service role and database operators. It returns aggregate deleted-row counts, sets a short lock timeout, and is transactional. A failed run rolls back; inspect scheduler failures and retry through the next scheduled run. Thresholds are processed at the next successful daily run, not at an exact second.

## Verification

`tools/retention/retention.integration.sql` must only be run on local Supabase inside an explicit transaction with rollback and `ON_ERROR_STOP=1`. Apply migration 0025 within that same transaction when testing an existing local stack. Tests create synthetic users and verify expired/recent records, preservation of tasks/projects/accepted memberships, invitation expiry and keys, and RPC permissions. Never reset a non-isolated database for these tests.

## Email history and deduplication

At 03:47 UTC, `purge_email_history()` removes terminal email records after 30 days: sent messages measured from sent_at, failed/dead from updated_at, only when retry_at is null. Queued/sending and retryable records remain. Initial ownership backfill updates updated_at, so legacy failed/dead rows receive a fresh 30-day diagnostic window at rollout.

A private registry stores only SHA-256 of the dedupe key and the associated Auth account UUID. It stores no raw key, recipient email, subject, body, or error. The hash is a technical identifier, not a claim of anonymization. Inserts reserve keys transactionally, including under concurrent retries; failed inserts roll back the reservation. Duplicate enqueue calls return null as before. Registry rows cascade on account deletion. Deleting full email history therefore does not allow old events to resend.

Ownership is resolved only when email, user UUID in the key and/or reminder ownership identify one account. Unresolved/ambiguous legacy records preserve existing delivery behavior and are excluded from automatic purge; the result reports their count as `legacy_rows_requiring_review`. Review these before claiming complete 30-day retention. Do not erase them merely to clear the count. Active outbox rows also reference the resolved account so deletion covers email-address changes.

Run handler regressions with `npm run retention:test`. Database tests also check terminal/retry preservation, unknown recipients, duplicate suppression after purge, failed-insert rollback, and receipt deletion with the account.

## Remaining scope

A local 30-day backup cleanup command is described in [encrypted database backups](encrypted-database-backups.md). It defaults to preview and requires explicit directory/project confirmation to delete expired pairs. Scheduling it, reviewing skipped files, Gmail cleanup and provider logs remain separate operational tasks. This migration does not deploy itself and is not proof of production retention.
