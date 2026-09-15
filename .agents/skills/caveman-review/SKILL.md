---
name: caveman-review
description: Present code-review findings concisely with location, impact, and a concrete correction.
---

# Review findings

Lead with actionable defects, ordered by severity. Each finding identifies the location, triggering condition, user or system impact, and a correction. Keep one line only when that preserves the explanation; expand security and subtle correctness findings.

Preserve uncertainty when evidence is incomplete. Avoid manufactured nits, arbitrary size limits, and generic praise. If no defects are found, say so and note relevant verification gaps.

Follow the requested output schema and citation format. A read-only review does not authorize edits, publishing comments, or approving a PR. A request to fix findings does authorize the scoped implementation and its checks.
