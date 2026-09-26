# Tickist agent guide

## Project context

Tickist is an Angular + Supabase task application in an npm/Nx workspace. Use Node 24 (>=24.15); `package.json` and the lockfile define framework versions.

| Area                            | Location                                                      |
| ------------------------------- | ------------------------------------------------------------- |
| Browser application             | `apps/tickist-web/src/app/`                                   |
| MCP Worker / shared data access | `apps/mcp/` / `libs/data-access/tickist/`                     |
| Playwright                      | `apps/tickist-web-e2e/`                                       |
| Database / Edge Functions       | `supabase/migrations/` / `supabase/functions/`                |
| Blog Markdown / public assets   | `apps/tickist-web/content/blog/` / `apps/tickist-web/public/` |

Read the relevant document when changing its contract: [product behaviour](doc/product-features.md), [architecture and access](doc/architecture.md), [automation](doc/edge-functions.md), [operations](doc/operations.md), [blog](doc/blog.md), or [public indexing](doc/public-content.md). Source, migrations, and tests settle stale documentation; routine edits do not require reading the whole knowledge base.

## Working agreement

- Carry an implementation through relevant verification and fix failures introduced by it. Make reversible decisions within the requested scope; ask only when a missing choice changes behaviour, scope, or authority.
- Prefer concise, complete sentences. Load a skill when its workflow helps or the user names it, not merely because a keyword matches. Announce it on first use. Read only supporting references relevant to the task.
- Preserve unrelated work. Work directly on `develop`; create a feature branch only with the user's explicit approval.
- Commit, push, publish, and deploy when requested. Existing authorization covers the named action and its verification; do not repeatedly ask. A previous feature's push request does not authorize publishing later work.
- A handoff states the result, meaningful verification, and unresolved limitations. Verify remote refs after a push; a feature-branch or `develop` push is not a production deployment. Production runs from `master`.

## Product boundaries

- `/` and locale blog routes are public. `/app/**` is private; `/auth/**` is transactional. Keep both, user-generated paths, `/env.js`, and MCP endpoints out of sitemaps.
- The MCP endpoint is `https://mcp.tickist.com/mcp`, served by `apps/mcp`. The application Worker does not proxy `/mcp`.
- Blog source is repository-owned Markdown. Use `add-tickist-blog-post` for imports; draft by default. Polish and English registries are independent; translation links require intentional editorial pairing. Generate public artifacts with `npm run blog:generate`.

## Data and security

- RLS is the authorization boundary. Browser and MCP OAuth access use the user's identity; keep service-role credentials server-side.
- `.local_env` is local, `.env` is remote, and `.local_env.e2e` / `.env.e2e` is E2E. Keep environment files and secrets out of commits and logs; do not print complete Supabase status output.
- Local tools use `SUPABASE_DB_URL`; remote operations intentionally use `SUPABASE_REMOTE_DB_URL`.
- E2E performs destructive resets. Verify `SUPABASE_E2E_DB_URL` and app API point to the intended local test stack before running. Never target remote data. Reusing the normal local database requires explicit user authorization and `E2E_ALLOW_LOCAL_DB_RESET=true`; setting the flag is not consent.
- Add numbered, backward-compatible migrations with unique versions. Do not edit migrations already shared or deployed.
- Keep `SUPABASE_SECRET_KEY`, `INTERNAL_FUNCTION_SECRET`, AWS credentials, and database passwords out of Angular and `/env.js`.

## Code and verification

- Match existing Angular standalone components, signals, and built-in `@if` / `@for` / `@switch` control flow. Use RxJS where streams fit.
- Avoid `any`, non-null assertions, unused imports, and dead symbols. Use snake_case database columns.
- Preserve responsive sheets/forms, supported themes, semantic controls, and keyboard access. Formatting and static rules live in Prettier, ESLint, and Oxlint configuration.
- Run repository targets through npm/Nx; `npm run start` checks the local Supabase stack and serves port 4200. Use `nx-workspace` for unfamiliar targets/dependencies, `nx-generate` for actual scaffolding, and `nx-run-tasks` for task selection or troubleshooting.
- Match verification to changed behaviour. App changes normally need lint, focused unit tests, a build, and relevant critical-journey E2E; database contracts need a local integration check. Add regressions for changed routes, access rules, data contracts, and task/project interactions.
- Documentation and agent-instruction changes need formatting, link/config checks, and `git diff --check`; they do not require application E2E. Run changed executable helpers against representative inputs.
- After relevant checks pass, stop repeating them unless code or evidence changes. Environment failures require diagnosis, not identical retries. Use [operations](doc/operations.md) for commands and E2E isolation.

## Documentation

Product behaviour changes update the relevant English `doc/` page and both public LLM files (`llm.txt`, `llm-full.txt`). Update README for changed setup, commands, architecture, or positioning. Blog content/schema changes also update `doc/blog.md` and the LLM editorial/SEO contract. Indexable-route changes also update sitemap, robots, and `doc/public-content.md`; use the generator for generated artifacts.

For internal tooling or instruction-only changes, update the affected developer guidance; do not describe them as product capabilities in the public LLM files. Agent configuration and hook maintenance are documented in [agent tooling](doc/agent-tooling.md).
