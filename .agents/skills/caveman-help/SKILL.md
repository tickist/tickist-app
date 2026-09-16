---
name: caveman-help
description: Explain the repository's Caveman modes and companion commands.
---

# Caveman help

Answer the requested command question without activating a mode.

- `caveman lite`: concise complete sentences (Tickist default).
- `caveman full` / `ultra`: progressively shorter phrasing.
- `caveman wenyan-lite` / `wenyan-full` / `wenyan-ultra`: explicitly requested Chinese style.
- `caveman-commit`: Conventional Commit wording.
- `caveman-review`: concise, evidence-backed review findings.
- `caveman-compress FILE`: shorten a selected prose file with a recoverable original.
- `caveman-stats`: report actual usage only when runtime measurements exist.
- `stop caveman` / `normal mode`: restore ordinary prose.

The repository does not install Caveman startup or statistics hooks. Do not claim a global environment variable or config file is effective without checking the installed integration.
