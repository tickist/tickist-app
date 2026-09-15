---
name: nx-run-tasks
description: Select and run Nx targets, including focused tests, affected projects, and failed-task diagnostics.
---

# Run Nx tasks

Use the known target directly. Query `npm exec nx show project PROJECT -- --json` only when its configuration is unclear.

Tickist commands:

```bash
npm exec nx lint tickist-web
npm exec nx test tickist-web
npm exec nx build tickist-web -- --configuration production
npm exec nx lint tickist-web-e2e
npx nx e2e tickist-web-e2e -- --project=chromium
```

- Select checks that exercise the change; independent targets may run together with `npm exec nx run-many -- -t lint test -p tickist-web`.
- Use resolved test targets or documented runner filters for focused tests. Do not guess argument forwarding.
- For changed-project selection, use `nx affected` with an intentional base and head; read the workspace skill's affected reference if needed.
- E2E resets its database. Follow `AGENTS.md` and `doc/operations.md` before execution; do not infer permission to reset ordinary local data.
- Track a running process until its exit code is known. Preserve the session handle when the tool yields.
- Rerun failed checks after a relevant fix. For opaque Nx failures, collect diagnostics with documented options such as `--verbose` or `--skipNxCache`; diagnose environment failures before another retry.
- Format only changed files: `npm exec nx format:check -- --files=path/to/file.md,path/to/other.ts`. Avoid a whole-repository fallback for a small edit.
