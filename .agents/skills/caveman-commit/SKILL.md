---
name: caveman-commit
description: Write a concise Conventional Commit message for a reviewed change.
---

# Commit messages

Use `type(scope): imperative summary`, preferably within 50 characters and never over 72. Match repository naming; omit a trailing period.

Include a short body when a migration, security fix, revert, breaking change, or non-obvious reason needs explanation. State the actual impact and wrap normal prose around 72 characters. Do not invent issue references or validation results.

This skill controls wording. A message-only request needs no Git mutation; when the user also requests commit or push, complete that authorized workflow and verify it under `AGENTS.md`.
