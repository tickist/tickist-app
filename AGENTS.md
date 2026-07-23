# Tickist agent guide

## Scope and source of truth

Tickist is an Angular 21 + Supabase task-management application in an Nx workspace. Work in `apps/tickist-web/` unless the task is explicitly about E2E, database migrations, Edge Functions, or repository documentation.

| Area                   | Location                                  |
| ---------------------- | ----------------------------------------- |
| Angular application    | `apps/tickist-web/src/app/`               |
| Playwright E2E         | `apps/tickist-web-e2e/`                   |
| Database migrations    | `supabase/migrations/`                    |
| Edge Functions         | `supabase/functions/`                     |
| Public static metadata | `apps/tickist-web/public/`                |
| Public blog            | `apps/tickist-web/src/app/features/blog/` |
| LLM knowledge base     | `doc/` and `/llm.txt`, `/llm-full.txt`    |

Read the relevant page in `doc/` before changing an established product area. Source code, migrations, and tests remain the final authority when documentation is stale.

## Product and route boundaries

- `/` is the public landing page.
- `/:locale/blog` is a public, indexable blog index. Supported locales are explicit; currently `en` and `pl`.
- `/auth/**` is transactional authentication and recovery UI.
- `/app/**` is an authenticated, user-private workspace.
- `/mcp` and `/env.js` are technical endpoints.

Never treat private routes, user data, API endpoints, or password-recovery URLs as public crawlable content.

### Public blog content

- Blog source is repository-owned Markdown under `apps/tickist-web/content/blog/`; `features/blog/blog-content.generated.ts` is generated output. There is no CMS, admin panel, database persistence, or comments in the first version.
- Use the repository-local `add-tickist-blog-post` skill for importing supplied Markdown. Keep new entries as drafts unless publication is explicit.
- Each language has a separate editorial registry. Never auto-translate, share a translation key, or infer article equivalents between locale registries.
- Before publishing a post, ensure its category, tags, canonical metadata, social-sharing URL, and sitemap policy are valid for that exact locale. Add `hreflang` only for intentionally linked language variants.
- Read `doc/blog.md` before changing the blog schema, routes, metadata, or publication workflow.

## Required documentation workflow

Documentation is part of every product change.

When adding, changing, or removing user-facing functionality:

1. update the relevant English document under `doc/`;
2. update `apps/tickist-web/public/llm.txt` with the concise capability summary;
3. update `apps/tickist-web/public/llm-full.txt` with the complete behaviour, data, route, or operational impact;
4. update `README.md` when onboarding, commands, architecture, configuration, or public product positioning changes;
5. add or update regression tests for the changed behaviour.

For a blog article or blog-schema change, also update `doc/blog.md` and describe the editorial/SEO contract in both LLM files.

When adding, changing, or removing an indexable public route, also update:

- `apps/tickist-web/public/sitemap.xml`;
- `apps/tickist-web/public/robots.txt`;
- `doc/public-content.md`.

Do not list `/app/**`, `/auth/**`, `/mcp`, `/env.js`, user-generated paths, or secret-bearing paths in the sitemap. Keep all `doc/`, `llm.txt`, and `llm-full.txt` content in English and factual.

## Local development and Nx

- Use Node 20 and npm.
- Start the app with `npm run start`; it verifies the local Tickist Supabase stack and serves port 4200.
- Use Nx through the workspace package manager: `npm exec nx <target>` or `npx nx` where Playwright argument forwarding is required.
- For workspace exploration, invoke `nx-workspace` first. For task execution, use `nx-run-tasks`. For scaffolding, invoke `nx-generate` before exploration.
- Do not guess unfamiliar Nx flags. Check `--help` or the appropriate Nx documentation first.

Useful commands:

```bash
npm exec nx lint tickist-web
npm exec nx test tickist-web
npm exec nx build tickist-web --configuration production
npm exec nx lint tickist-web-e2e
npx nx e2e tickist-web-e2e -- --project=chromium
```

## Supabase and security

- `.local_env` is local; `.env` is remote; `.local_env.e2e` or `.env.e2e` is E2E. Do not commit any of them.
- Use `SUPABASE_DB_URL` for local tooling and `SUPABASE_REMOTE_DB_URL` only for intentional remote operations.
- E2E resets `SUPABASE_E2E_DB_URL`. It must not target the remote database. Reusing the normal local database requires the explicit, localhost-only `E2E_ALLOW_LOCAL_DB_RESET=true` opt-in.
- Treat `SUPABASE_SECRET_KEY`, `INTERNAL_FUNCTION_SECRET`, AWS credentials, and database passwords as server-side secrets. Never expose them in Angular, `/env.js`, logs, fixtures, or documentation examples with real values.
- Add database changes as new numbered migrations. Keep them additive and backward-compatible; do not edit deployed migrations or create duplicate version prefixes.
- RLS is the authorization boundary. Do not solve access problems by moving service-role credentials into client code.

## Angular and code quality

- Use Angular standalone components; do not introduce NgModules.
- Prefer signals. Use RxJS only when a stream is the right abstraction.
- Use 2-space indentation, PascalCase classes/components, camelCase TypeScript names, and snake_case database columns.
- In templates use `@if`, `@for`, and `@switch`; do not introduce `*ngIf`, `*ngFor`, or `*ngSwitch`.
- Prefer semantic interactive elements. A non-interactive element with a click handler must also be keyboard accessible, but a real `button` is usually correct.
- Avoid `any`, non-null assertions, unused imports, and dead symbols. Keep `nx lint tickist-web` clean.
- Preserve the Tickist dark visual language and responsive, keyboard-accessible sheets/forms.

## Tests and verification

- Use Vitest for services, guards, and components; use official Supabase client helpers rather than ad-hoc API mocks.
- Use Playwright for critical user journeys: auth, projects, tasks, tags, dashboard, settings, reminders, and persistence.
- Add a regression test whenever a route, auth rule, data contract, task/project interaction, or public metadata behaviour changes.
- Before handoff, run validation proportional to the change. For app behaviour, normally run lint, focused unit tests, a production build, and relevant E2E. For documentation-only work, run formatting and `git diff --check`.

## Git and delivery

- Branch from `develop` using `rewrite/<feature>` or `supabase/<area>`.
- Use imperative, scoped commits such as `feat(tasks): add completion badge`.
- Only commit or push when the user explicitly asks.
- Preserve unrelated work in a dirty tree. Never reset, discard, or rewrite user changes without explicit approval.
- PR descriptions must mention migration-plan changes, touched Nx targets, and relevant CLI output or screenshots.

## Communication and skills

- Use caveman lite for technical updates: concise, complete sentences, no filler. Keep user documentation, commits, safety warnings, and irreversible actions in normal prose.
- Announce a skill before using it. Read the entire `SKILL.md` before acting on a selected skill.
- Explain the outcome first, then only the detail needed to verify it.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
