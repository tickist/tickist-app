---
name: monitor-ci
description: Check or watch CI for a branch, using the configured provider and Nx Cloud self-healing when available.
---

# CI status and monitoring

Resolve the requested branch and commit. Distinguish a one-time status check from watching until completion and from fixing failures.

Tickist sets `neverConnectToCloud: true` in `nx.json` and runs GitHub Actions. Use GitHub's available connector or CLI for this configuration; do not connect Nx Cloud or stop with an installation recommendation.

- Find runs for the requested branch and SHA. For one-time status, report their current state and link.
- For watching, use the runtime's wait/monitor mechanism and provider reads; report changes and stop on a terminal result or the user's limit. An unchanged pending run is not a failure.
- Fetch failed job details only when needed to explain or fix a failure.
- A monitoring request authorizes reads and waits. Apply changes, rerun jobs, or push fixes only when the user has included those actions in scope. Existing authorization need not be requested again.
- Fix failures caused by the scoped change and verify affected targets before an authorized push. Do not create empty commits or cancel runs merely to drive the monitoring loop.

When a workspace actually has Nx Cloud configured and its tools available, use its self-healing status to avoid racing an active fix. Read [the Cloud workflow](references/cloud-monitoring.md) only for that route; it uses the bundled decision/state scripts. Read [fix flows](references/fix-flows.md) only for a proposed fix.

Report the branch/SHA, terminal or current state, relevant run links, and any checks that never ran. A script's suggested action is not permission for an external mutation.
