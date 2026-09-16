---
name: nx-generate
description: Scaffold an Nx application, library, component, or other artifact with an appropriate installed generator.
---

# Nx generation

Choose an installed generator that matches the requested artifact and repository conventions. Prefer a suitable local generator.

```bash
npm exec nx list @nx/angular
npm exec nx generate @nx/angular:component -- --help
```

- Inspect a comparable artifact and generator options. Read generator source only when options or side effects remain unclear.
- Check the destination path: a generator's directory option may mean the complete artifact path, not its parent.
- Preview placement and configuration changes with a dry run when supported. Execute non-interactively using documented flags.
- Use an internal, source-consumed library unless the request needs an independent build or publication. Do not ask about routine buildability choices already settled by the task.
- If no suitable generator exists, implement the artifact directly.
- Adapt the generated code and validate the affected contracts. Keep meaningful tests when replacing scaffold tests; do not leave a target pointing to an empty suite.
- For actual package dependency links, use `link-workspace-packages`. Existing TypeScript path aliases are not automatically a linking defect.
