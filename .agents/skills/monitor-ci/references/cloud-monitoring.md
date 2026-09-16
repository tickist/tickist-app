# Nx Cloud monitoring

Use only when Nx Cloud is connected and its MCP tools are available. The entrypoint's scope and authorization rules apply to every action below. Calls may run directly; use the configured CI helper only if delegation is available, authorized, and useful.

## Bounds and state

Preserve requested limits and prior state unless a fresh run was requested. Defaults are a 120-minute deadline, at most 10 agent-initiated CI cycles, 10 minutes waiting for a new attempt, and 3 local verification attempts. Use the actual deadline; never refresh it on a retry.

Initialize counters to zero, prior statuses/URLs/SHA to null, and `wait_mode` / `agent_triggered` to false:

```text
cycle_count, start_time, no_progress_count, local_verify_count, env_rerun_count
last_cipe_url, expected_commit_sha, agent_triggered, poll_count, wait_mode
prev_status, prev_cipe_status, prev_sh_status
prev_verification_status, prev_failure_classification
```

The scripts in the skill's `scripts/` directory implement counters and transitions. Use their returned values rather than duplicating their thresholds in prose.

## Poll

Call `ci_information` with the branch and the lightest useful `select`:

```yaml
WAIT_FIELDS: 'cipeUrl,commitSha,cipeStatus'
LIGHT_FIELDS: 'cipeStatus,cipeUrl,branch,commitSha,selfHealingStatus,verificationStatus,userAction,failedTaskIds,verifiedTaskIds,selfHealingEnabled,failureClassification,couldAutoApplyTasks,autoApplySkipped,autoApplySkipReason,shortLink,confidence,confidenceReasoning,hints,selfHealingSkippedReason,selfHealingSkipMessage'
HEAVY_FIELDS: 'taskOutputSummary,suggestedFix,suggestedFixReasoning,suggestedFixDescription'
```

Use WAIT_FIELDS after an action while awaiting a new attempt; otherwise use LIGHT_FIELDS. Fetch heavy fields only for a relevant failure/fix; paginate long strings with `pageToken` as needed.

Run the decision script with the response and accumulated state. Pass JSON as an argument with safe shell quoting or a structured process API, never as interpolated shell code.

```text
node <skill_dir>/scripts/ci-poll-decide.mjs <response_json> <poll_count> <verbosity>
  [--wait-mode]
  [--prev-cipe-url <last_cipe_url>]
  [--expected-sha <expected_commit_sha>]
  [--prev-status <prev_status>]
  [--timeout <configured_timeout_seconds>]
  [--new-cipe-timeout <new_cipe_timeout_seconds>]
  [--env-rerun-count <env_rerun_count>]
  [--no-progress-count <no_progress_count>]
  [--prev-cipe-status <prev_cipe_status>]
  [--prev-sh-status <prev_sh_status>]
  [--prev-verification-status <prev_verification_status>]
  [--prev-failure-classification <prev_failure_classification>]
```

Pass the full configured timeout, not a shrinking remainder: the script estimates elapsed polling time from `poll_count`. Enforce the actual wall-clock deadline independently as well.

Update `no_progress_count` and `env_rerun_count` from the output, prior statuses from the response, and `prev_status` to `action + ":" + (code || cipeStatus)`; increment `poll_count`. On `newCipeDetected`, clear wait mode and reset local verification/environment rerun counts.

For `poll` or `wait`, observe the returned delay through the runtime wait mechanism. For `done`, classify the cycle before handling the code:

```text
node <skill_dir>/scripts/ci-state-update.mjs cycle-check
  --code <code> [--agent-triggered]
  --cycle-count <cycle_count> --max-cycles <max_cycles>
  --env-rerun-count <env_rerun_count>
```

Update state from the result. Report terminal success, cancellation, timeout, exhausted limits, or persistent errors accurately. A circuit-breaker result is a monitoring limit, not proof that CI failed. Read fix flows for actionable failures.

## After an authorized action

Use `ci-state-update.mjs post-action --action TYPE --cipe-url URL --commit-sha SHA`; carry all returned state into the next poll.

- `fix-auto-applying`, `apply-mcp`, `env-rerun` track a CI attempt URL.
- `apply-local-push`, `reject-fix-push`, `local-fix-push`, `auto-fix-push` track the expected commit SHA.
- Observe an already-auto-applying fix without sending another APPLY or editing the same failure.
- A newer human push is not an agent-initiated cycle; ensure reported success belongs to the intended commit.

On a tool failure, retry only when the cause is plausibly transient; otherwise use a provider read for visibility and report the unavailable Cloud details. Do not make infrastructure changes to enable the workflow.
