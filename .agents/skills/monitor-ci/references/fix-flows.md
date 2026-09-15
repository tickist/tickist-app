# Nx Cloud fix flows

Read after a Cloud status identifies a proposed fix and only within the user's requested scope. A status-only request ends with findings. A fix request permits scoped code changes and verification; commit, push, remote APPLY, REJECT, and environment reruns must also be authorized.

## Handling results

| Code                            | Next step                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `fix_auto_apply_skipped`        | Explain the reason; apply only if authorized.                                       |
| `fix_apply_ready`               | Inspect the relevant fix and verification; use APPLY if appropriate and authorized. |
| `fix_needs_local_verify`        | Fetch fix details and run the reported verifiable tasks.                            |
| `fix_needs_review`              | Inspect the actual patch and failure evidence before choosing a correction.         |
| `fix_failed` / `no_fix`         | Diagnose failed tasks; attempt a scoped local fix when requested.                   |
| `environment_issue`             | Diagnose environment failure; use a permitted bounded rerun if justified.           |
| `self_healing_throttled`        | Explain throttling; do not bulk-reject unrelated fixes to unblock it.               |
| `no_new_cipe` / `cipe_no_tasks` | Inspect provider logs. Do not create empty commits to force a run.                  |

## Local correction

Fetch heavy details only for the failure being handled. Inspect patches before applying them; summaries alone may omit a correctness or security issue.

Use the bundled state gate before another fix attempt:

```text
node <skill_dir>/scripts/ci-state-update.mjs gate --gate-type local-fix
  --local-verify-count <count> --local-verify-attempts <limit>
```

If allowed, carry the returned count forward, apply the scoped correction, and rerun affected checks. Independent checks may run concurrently without spawning one agent per target. Check the installed CLI before using `nx-cloud apply-locally`; preserve unrelated changes.

When verification passes, complete an already-authorized commit/push and track the new SHA through `post-action`. If limits are exhausted or verification remains broken, report it; do not push knowingly failing work merely to end a loop.

## Remote actions

`update_self_healing_fix` accepts a fix `shortLink` and `APPLY`, `REJECT`, or `RERUN_ENVIRONMENT_STATE`. Send only the action covered by the request. For an environment rerun, use the `env-rerun` state gate with the current `--env-rerun-count` and preserve its returned counter.

Distinguish compilation/assertion failures from missing tools, credentials, permissions, Docker, network, and resource failures. Address a recoverable in-scope cause before retrying; otherwise give a concrete blocker. Keep credentials and complete environment dumps out of diagnostics.
