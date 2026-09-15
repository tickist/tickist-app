---
name: link-workspace-packages
description: Repair or add a dependency between actual npm workspace packages when a sibling package does not resolve.
---

# Link workspace packages

Identify the importing package, provider, package names, and declared npm workspaces. A project listed by Nx is not necessarily an npm workspace package.

For registered npm workspaces:

```bash
npm install @scope/provider --workspace @scope/consumer
```

npm does not use the `workspace:` dependency protocol. Inspect the resulting package/lockfile changes and verify that resolution points to the local provider rather than a registry package.

Tickist also uses root-managed dependencies and TypeScript aliases. If the consumer/provider are not npm workspace packages, inspect their existing aliases, exports, and Nx configuration; do not convert the repository to npm workspaces merely to fix an import.

Use the consumer's relevant typecheck, test, or build to verify the dependency. Do not add a new path alias solely to hide a broken declared package dependency.
