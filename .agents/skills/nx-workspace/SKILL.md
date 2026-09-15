---
name: nx-workspace
description: Inspect Nx project targets and dependencies, or diagnose missing and inferred target configuration.
---

# Nx workspace

Use npm in Tickist. Read only the project or configuration needed for the question.

```bash
npm exec nx show projects -- --json
npm exec nx show project tickist-web -- --json
npm exec nx graph -- --print
```

- `show project --json` includes inferred targets; `project.json` alone does not. Inspect it when target availability or execution settings are uncertain.
- Use `nx.json` for workspace plugins, defaults, and cache inputs. Source searches and direct file reads are sufficient for ordinary code questions.
- Filter JSON to the needed fields; avoid printing the whole graph for one dependency.
- For affected-project selection, read [AFFECTED.md](references/AFFECTED.md).
- For unfamiliar flags or plugin behaviour, check local `--help`, installed plugin guidance, or Nx documentation through MCP when available.
- Treat `nx sync` and `nx reset` as actions, not read-only discovery. Use them only when the diagnosed problem calls for them.
