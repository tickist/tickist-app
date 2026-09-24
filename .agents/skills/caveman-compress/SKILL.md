---
name: caveman-compress
description: Shorten a selected prose instruction file while preserving its meaning and a recoverable original.
---

# Compress prose

Read the selected file and shorten redundant prose. Preserve decisions, scope, exceptions, uncertainty, headings, code, inline literals, links, paths, numbers, and technical facts. Clear sentences matter more than a target reduction.

Keep a recoverable original at `<stem>.original.md` before overwriting; do not overwrite an existing backup or compress a backup. Never process code/configuration or secret-bearing files. Preserve mixed code sections verbatim. Review the diff for semantic loss before handoff.

The bundled `scripts/` are a legacy Claude-backed compressor. They can send full file content to Anthropic or a Claude CLI subprocess and require that backend. Use them only when that execution and data transfer are within the user's request; otherwise edit locally with the available file-editing tool. Read [SECURITY.md](SECURITY.md) before using the legacy backend.

Report the changed path and unresolved ambiguity. Compression of a named repository file does not authorize editing agent-global memories or unrelated configuration.
