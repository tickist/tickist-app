---
name: cavecrew
description: Plan a delegated investigation, implementation, or review with compact evidence-backed handoffs.
---

# Compact delegation

Use delegation only when authorized by the session and when a bounded subtask can run independently alongside useful work. Routine edits do not need an investigator-builder-reviewer chain.

Use agent types actually available in the current runtime. The upstream `cavecrew-investigator`, `cavecrew-builder`, and `cavecrew-reviewer` presets are not installed by this repository.

Give each worker its concrete question or file ownership, relevant constraints, and expected evidence. Tell editing workers that others may be editing concurrently and to preserve those changes.

A useful handoff contains the result, relevant paths/lines, checks actually run, and unresolved issues. Keep enough explanation to assess correctness; do not enforce token percentages, cryptic terminal codes, or arbitrary file-count limits.

For a small task or unavailable delegation, continue in the main thread.
