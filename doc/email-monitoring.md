# Administrator email monitoring

This is internal operator tooling, not a general user administration console.

## Behaviour

The private route `/app/admin/email` shows aggregate SES usage for the configured AWS region, the actual quota, the expected limit, the time of the last successful reading, application outbox counts and the last 20 alerts. Links in Settings and the avatar menu are visible only after a server-verified administrator check. Opening the avatar menu checks access again. A missing, failed or more than ten-minute-old reading is visibly marked as unavailable or stale; no successful reading is invented.

The internal `email-delivery-monitor` worker runs every five minutes. It calls SES v2 `GetAccount`, which reports `SentLast24Hours` across SMTP and API in that region. It therefore includes Supabase Auth emails when Auth and the application sender use the same SES region and account. The outbox counts are shown separately and do not include Auth. The monitor does not inspect recipients, message contents, AWS credentials or SMTP passwords.

Warning thresholds are 80% and 95% of the lower of the expected limit and actual SES quota. The expected limit defaults to 100 recipients/rolling 24 hours. This setting **does not change or enforce the AWS quota**. A mismatch with the actual AWS quota produces a separate alert. SES exhaustion, disabled SES sending, unavailable monitoring and recent outbox failures also produce alerts. Auth SMTP failures are not individually collected; SES usage/exhaustion still covers that sending path.

If a sample jumps over several usage thresholds, only the highest new usage alert is queued. Active incidents are remembered in PostgreSQL; repeated samples do not send repeated notifications. Each incident can alert again after recovery. Failed reads preserve the last good sample and do not reset an existing quota incident.

Alerts are published to a configured **standard Amazon SNS topic**, independently of SES. PostgreSQL claims prevent overlapping workers from publishing the same pending row concurrently. Failed publication retries with delays, up to five attempts. Accepted publications mean SNS accepted the message, not that an inbox received it. A crash after SNS acceptance but before the database acknowledgement can cause a duplicate because standard SNS is at least once. Completed/failed alert history is retained for 30 days. Active incident state and the last sample remain.

Polling can alert only after a reading; it cannot promise an alert before a rapid burst fills the quota. If the worker, scheduler or database is completely down, it cannot send its own outage alert. Use an independent heartbeat monitor if that stronger guarantee is needed.

## Access boundary

Migration 0029 created `app_administrators`. Migration 0031 creates `public.profiles` with `user_id` and an operator-managed `is_admin` flag. It copies any existing administrator memberships, gives every other existing Auth user `false`, and creates a `false` row for each new Auth user. From 0031 onward, `is_app_administrator()` reads `profiles.is_admin`; `app_administrators` is no longer the access source. Authenticated users can read only their own profile flag and cannot insert, update or delete profile rows. Editable Auth user metadata, including a forged `is_admin` field, has no effect. RLS permits only administrators to read health/history. The aggregate overview RPC checks the flag again before using its security-definer access to the private outbox. Anonymous callers and ordinary users cannot read the overview; browser roles cannot invoke recording, claiming or publication-acknowledgement RPCs.

After deploying migration 0031 and the frontend, find the chosen existing account under Supabase **Authentication → Users**, verify its UUID, then open **Database → Table Editor → public.profiles** and change `is_admin` from `false` to `true` only for the row with that `user_id`. The equivalent operator SQL is:

```sql
update public.profiles
set is_admin = true
where user_id = '<VERIFIED_AUTH_USER_UUID>' and is_admin = false;
```

Verify that exactly one row changed and that the account can open the panel. To revoke access, set the same row back to `false`. Do not use Auth `user_metadata` or give service-role access to the browser. No account is promoted by default.

## Deployment preparation

Apply 0029, 0030 and 0031, deploy the worker and frontend, then verify the scheduler. Migration 0030 reuses `tickist_functions_base_url` and `tickist_internal_function_secret` in Vault, as existing notification workers do. Its POST endpoint accepts only the `x-internal-function-secret` header. It does not accept an end-user token or arbitrary alert destination/body.

The production workflow synchronizes these server-side settings:

- `EMAIL_MONITOR_TARGET_LIMIT`: positive integer; default `100`. Raising it only changes warning thresholds.
- `EMAIL_MONITOR_SNS_TOPIC_ARN`: exact standard SNS topic ARN in `AWS_REGION`. Empty disables external publication while recording warnings in the panel.
- Existing `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, optional `AWS_SESSION_TOKEN`, `AWS_REGION`, `SUPABASE_SECRET_KEY`, and `INTERNAL_FUNCTION_SECRET` are reused. No new secret enters Angular or `/env.js`.

Create a standard SNS topic in the monitored region, subscribe the operator's chosen email address and **confirm the subscription from the received email**. Verify its delivery with an explicitly authorized test alert before relying on it. Merely setting the topic ARN does not prove a subscription is confirmed.

Prepare a separate least-privilege IAM policy for the API worker's existing principal. Keep sending policies and their From-address restriction intact; do not attach the From-address condition to quota reads. Replace placeholders with the verified region/account/topic before applying:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ses:GetAccount",
      "Resource": "*",
      "Condition": { "StringEquals": { "aws:RequestedRegion": "<AWS_REGION>" } }
    },
    {
      "Effect": "Allow",
      "Action": "sns:Publish",
      "Resource": "arn:aws:sns:<AWS_REGION>:<ACCOUNT_ID>:<TOPIC_NAME>",
      "Condition": { "StringEquals": { "aws:RequestedRegion": "<AWS_REGION>" } }
    }
  ]
}
```

Code preparation does not apply IAM changes, create subscriptions, provision an administrator, publish a test alert, or deploy production. Those require the relevant operator authorization and selected identities/destination.

## Verification

Use Node 24.15+:

```bash
npm run email-monitor:test
npm exec nx test tickist-web -- --testFiles=email-monitoring --testFiles=admin.guard
npm run email-monitor:test:db
```

The database test starts and removes its own disposable, unexposed Supabase PostgreSQL container. It does not read any application database URL or reset a local/remote Tickist stack. It verifies profile backfill and signup defaults, denial of direct and metadata-based self-promotion, RLS, RPC denial, aggregate-only reads, threshold deduplication, overlapping claims, stale acknowledgement rejection, bounded retries and the scheduler migration.

After authorized deployment, confirm the chosen administrator can open the panel, an ordinary user is denied, samples refresh within five minutes, expected and actual quotas are distinguished, SNS subscription is confirmed, and a test alert arrives. Never use a test recipient to consume the entire SES quota.

Sources: [SES GetAccount](https://docs.aws.amazon.com/ses/latest/APIReference-V2/API_GetAccount.html), [SNS Publish](https://docs.aws.amazon.com/sns/latest/api/API_Publish.html), [SNS email subscriptions](https://docs.aws.amazon.com/sns/latest/dg/sns-email-notifications.html).
