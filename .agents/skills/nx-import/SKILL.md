---
name: nx-import
description: Bring a repository or project and its Git history into this Nx workspace.
---

# Import into Nx

Establish the source repository/revision, selected projects, and destination paths. Use `npm exec nx import -- --help` for the installed version's options and side effects.

- Preserve source history and existing destination work. Explain required Git mutations before execution when the import request does not already cover them.
- Prefer separate subdirectory imports for monorepo sources; a whole-repository import can suit a standalone project. The destination must not collide with existing files.
- Match `apps/` and `libs/` conventions and unique project/package names.
- Merge the needed root dependencies, Nx plugins, cache inputs, and target defaults: importing source files alone does not bring these contracts across.
- Inspect inherited tsconfig paths, package exports, workspace links, and explicit executor paths after relocation.
- Keep npm as the destination package manager. Check installed peer ranges rather than imposing a version workaround from a previous import.
- Remove source-generated artifacts only after confirming their origin and references. Do not blanket-delete imported configuration, documentation, or lockfiles.
- Verify resolved Nx projects and the relevant imported/consumer targets. Diagnose failures before changing unrelated workspace configuration.

Read only the reference for a source technology that actually needs adaptation:

- [ESLint](references/ESLINT.md)
- [Gradle](references/GRADLE.md)
- [Jest](references/JEST.md)
- [Next.js](references/NEXT.md)
- [Turborepo](references/TURBOREPO.md)
- [Vite](references/VITE.md)

These references include upstream examples for other package managers and older toolchains. Adapt examples to installed versions and Tickist's npm configuration; they are not blanket migration instructions.
