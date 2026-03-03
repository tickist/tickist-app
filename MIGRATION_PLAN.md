# Tickist Supabase Migration Plan

## Context & Goals
- The legacy Firebase + Angular 17 app has been retired; the Angular 20 + Nx + Vite workspace is the active codebase.
- Target stack: Angular 20 standalone components, Nx 22, TailwindCSS + DaisyUI for styling, Supabase (Postgres, Auth, Storage, Edge Functions) instead of Firebase, and no NgRx or Angular Material.
- Migration must preserve existing Tickist capabilities (tasks/projects hierarchy, tags, repeat rules, steps, collaboration/sharing, reminders/notifications, PWA, etc.) while reducing tech debt and simplifying deployments.
- Authentication starts with email + password only; additional providers will be evaluated after parity is achieved.
- Preserve the current Tickist color palette and introduce an optional light theme once the Supabase variant stabilizes.

## Phase 0 – Inventory & Guardrails
1. Document any remaining legacy behaviors or gaps before porting.
2. Produce a feature backlog by auditing the old app (routes, components, libs) and README feature list.
3. Capture environment needs (Firebase emulators, service accounts) so we can map them to Supabase equivalents.
4. Define acceptance criteria for parity (UX behaviors, accessibility standards, performance budgets) and capture the legacy palette tokens needed for light/dark variants.

## Phase 1 – Platform & Tooling Setup
1. Finalize Nx workspace layout (apps vs. libs) and naming conventions for the new codebase.
2. Configure Tailwind + DaisyUI with theming tokens that match Tickist branding (dark-first, optional light toggle). ✅ Completed in `tailwind.config.ts`; extend themes there as new surfaces are added.
3. Introduce shared linting/formatting rules (ESLint flat config, Prettier) and GitHub Actions workflows (build, lint, test) to replace Azure Pipelines; document pros/cons for Cloudflare vs. Vercel but postpone the final hosting choice until the Supabase MVP is ready.
4. Remove any PWA/service-worker code paths until the core app ships, then capture follow-up tasks for re-enablement.
5. Wire Supabase client SDK (environment-driven, SSR-safe helpers) and secrets management for local/dev/staging/prod. ✅ `provideSupabase` + `.env.example` now exist; next step is replacing the mock auth fallback with live credentials.

## Phase 2 – Data Modeling & Supabase Backend
1. Translate Firebase collections (tasks, projects, tags, notifications, users, settings) into normalized Postgres tables plus views/materialized views where needed. ✅ Core tables (`Projects`, `Project_members`, `Tasks`, `Task_steps`, `Task_tags`, `Task_assignees`, `Tags`, `App_users`) now exist under `supabase/migrations/0001_init_schema.sql`.
2. Implement Row-Level Security policies that mirror Firebase security rules (e.g., owner and collaborator scopes).
3. Create Supabase Edge Functions to replace Firebase Cloud Functions (scheduled reminders, cascading updates, webhook integrations).
4. Provide migration scripts to seed Supabase from existing production exports (CSV/JSON import, id mapping, timestamp fidelity).
5. Set up automation for schema drift checks (Supabase CLI + migration files committed under `supabase/migrations`).

### Supabase schema snapshot
- `app_users`: mirrors Firebase `users` document; stores username/avatar/preferences and references `auth.users`.
- `projects`: retains fields such as `color`, `icon`, `defaultFinishDate`, `taskView`, `projectType`, `ancestor` (self-reference). `project_members` replaces duplicated `shareWith` arrays.
- `tags`: 1 row per legacy tag; `task_tags` handles the `tagsIds` duplication.
- `tasks`: mirrors the Firestore shape (`name`, `description`, `finishDate`, `finishTime`, `repeat`, `priority`, `taskProject`, `owner`, `author`, `lastEditor`, `whenComplete`, etc.). `task_steps` & `task_assignees` remove embedded arrays.
- `notifications`, `routine_reminders`, and `activity_logs` capture Firebase Cloud Function side effects (alerts, routines, audit trail) so we can phase out Firestore collections.
- `functions/task-reminder` (Supabase Edge Function) replaces the Firebase notification trigger; the Angular app now calls it whenever a task is marked complete.
- `functions/project-update` and `functions/routine-runner` cover project sharing notifications and routine reminder placeholders (run via Supabase Cron once ready).
- Indices exist on owner/project columns so we can query inbox/tasks efficiently; future migrations can add views/materialized views for dashboards.

## Phase 3 – Frontend Architecture & Shared Systems
1. Build core domain services (AuthService, TaskService, TagService, NotificationService) using Angular signals/observables, not NgRx.
2. Establish UI primitives with Tailwind + DaisyUI (layout grid, cards, buttons, inputs, dialogs) and encapsulate them in `libs/ui`, reusing the brand palette + new light variant.
3. Implement data-access libraries that encapsulate Supabase queries/mutations and error handling.
4. Add caching/sync strategies (optimistic updates, offline queueing) and feature-gated experimentation hooks.
5. Introduce cross-cutting concerns early: toast/alert bus, logging, analytics events, feature flag wiring.
6. Deliver a marketing/landing experience inside the main app with placeholder content until final copy/designs are ready.
7. Supabase session service + `/app` guard are scaffolded; replace the mock auth flow with real Supabase listeners when credentials are wired in.

## Phase 4 – Feature Migration Matrix
1. **Landing & Marketing Surface**: Hero section, waitlist CTA, roadmap summary, color-mode toggle placeholder.
2. **Auth & Accounts**: email/password first release, with OAuth/passwordless deferred; account settings, subscription/billing hooks.
3. **Task Core**: CRUD for tasks/projects, nested hierarchy, due/on-by dates, estimates, drag-and-drop ordering.
4. **Metadata**: tags/labels, repeat rules, steps/subtasks, attachments.
5. **Collaboration**: sharing projects, role-based permissions, activity feed, notifications (email/in-app).
6. **Productivity Views**: calendar/agenda, focus mode, filtered lists, search, archived items.
7. **Automations**: reminders, recurring task generation, priority calculations.
8. **PWA & Offline**: service worker, manifest, background sync for Supabase (if available) or custom queue — reintroduce only after the core experience is stable.
9. Track each feature with owner, status, blockers, and Supabase dependencies in a shared tracker (Notion/Jira); link entries back to this plan.

## Phase 5 – Quality, Observability & Security
1. Unit tests (Vitest) for services/components, focusing on Supabase interactions and business logic.
2. Expand the existing Playwright scaffolding once the Supabase app is runnable; no legacy Cypress updates are required before that point.
3. Accessibility audits (Angular a11y tooling, Axe) and performance checks (Lighthouse, Web Vitals).
4. Monitoring/telemetry plan: Supabase logs, frontend error reporting, alerting thresholds.
5. Security reviews for RLS policies, secret storage, dependency scanning (e.g., `nx audit`, `npm audit`).

## Phase 6 – Cutover & Documentation
1. Run final data export/import, verify counts, and execute Supabase migration scripts in prod.
2. Toggle traffic via environment switch or DNS once Supabase app passes smoke tests; align hosting with the chosen provider (Cloudflare/Vercel).
3. Maintain a deprecation window for legacy data flows; patch only critical issues in the current app.
4. Re-enable PWA capabilities and background sync after monitoring confirms stability.
5. Update all documentation (README, AGENTS, onboarding runbooks) to describe the Supabase architecture and new workflows.
6. Schedule a post-cutover review to capture lessons learned and backlog carry-overs.

## Tracking & Evolution
- This plan lives in `MIGRATION_PLAN.md`. Update it as milestones change; note date + owner per edit.
- Summaries of plan changes should be mirrored in `AGENTS.md` so all contributors know where to look.
