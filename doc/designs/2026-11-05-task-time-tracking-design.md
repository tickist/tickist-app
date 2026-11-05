# Task time tracking and focus mode — design

Status: approved by the owner on 2026-11-05. Replaces the uncommitted Golden Hour implementation.

## Intent

The owner reviews each evening how much time went into each task, then copies the numbers into a spreadsheet to know what each piece of work cost. The summary has to work by day and in context: by project (including subprojects) and by tag.

The Golden Hour concept (planned/done golden hours, "ideal" rating, daily golden-hour counts) copied Planister's model and got in the way. What matters is simpler:

1. Click Start on a task, see only that task and a running clock, and focus.
2. Every stretch of work is recorded with its start and end.
3. Forgotten work can be added or corrected by hand.
4. Reports, the daily email and MCP read the same records.

## Goals

- One record type, a **time entry**, with `started_at` and `ended_at`. Durations are computed when read.
- **Focus mode** started from any incomplete task: a distraction-free screen with the task and a clock. Focus mode always belongs to a task; it cannot run without one.
- **Optional limit**: a setting with either "limit X minutes" or "no limit". When the limit is reached, the browser plays a chime, shows a notification if permitted, and the clock changes colour. The entry keeps running until Stop.
- **Pause** ends the current entry; **Resume** starts a new one. There is no separate pause concept.
- **Manual entries**: add, edit and delete an entry with date, start time and end time.
- **Day report** in the app: pick a date, see time per task grouped by project (subprojects roll up) or by tag, with two columns: "Me" and "Everyone".
- **Daily summary email**: a "Time worked today" section with the same grouping and both columns.
- **MCP**: read the report and list, create, update and delete the caller's own time entries.
- "Time spent" on a task becomes the total of its entries.

## Non-goals (v1)

- CSV or file export (the owner copies the table by hand or uses MCP).
- Task duplication. It is a separate, independent small feature, built afterwards as a task-card menu action (see product features).
- Starting or stopping the timer through MCP.
- Weekly or monthly views in the app (MCP accepts a date range).
- Billing rates or money amounts.

## Anti-goals

- Reintroducing Golden Hour vocabulary or counters.
- Two sources of truth for spent time.
- Numbers that differ between the app, the email and MCP for the same day.
- One collaborator seeing another collaborator's individual entries (only totals are shared).

## Data model

Replace migration `0040_golden_hours.sql` (never committed or deployed) with `0040_task_time_entries.sql`. Remove all Golden Hour code, tests, docs and the `golden-hour:test:db` script.

`public.task_time_entries`:

- `id uuid pk`
- `task_id uuid not null → tasks(id) on delete cascade`
- `owner_id uuid not null → auth.users(id) on delete cascade` (the person who worked)
- `started_at timestamptz not null`, `ended_at timestamptz null` (null = running)
- `limit_minutes smallint null` (copied from the setting at start; null = no limit)
- `source text check in ('timer', 'manual')`
- `note text null`, length-limited (builder's call: 500 characters)
- `created_at`, `updated_at`
- Checks: finite timestamps; `ended_at > started_at`; an entry lasts at most 24 hours.
- Partial unique index: one running entry per `owner_id`.
- Overlapping entries for the same owner are rejected, for example with an exclusion constraint on `tstzrange(started_at, coalesce(ended_at, 'infinity'))`.

Access:

- RLS: a user selects, inserts, updates and deletes only their own entries, and only on tasks they can access (owner or `can_access_project`).
- "Everyone" totals come from a `security definer` report RPC that returns aggregates for tasks the caller can access, never other people's rows.
- Grants follow the `0037` style; no TRIGGER, TRUNCATE or REFERENCES for browser roles.

Task totals:

- At migration, current `tasks.spent_minutes` values move to a new `tasks.spent_minutes_legacy` column. They are undated, so they never appear in day reports.
- `tasks.spent_minutes` becomes a cached total, maintained by a trigger as `spent_minutes_legacy` plus the sum of closed entries from all users. Existing readers (task card, progress bar, export, MCP `get_task`) keep working.
- Browser and MCP writes to `spent_minutes` stop. The composer shows the total read-only, plus the entry list and an "Add time" action.

Account setting: `app_users.focus_limit_minutes smallint null default 50 check between 1 and 600`; null means no limit.

## Day boundaries

A day is the calendar date of `started_at` in the account's IANA timezone (`app_users.timezone`). An entry that crosses midnight belongs to the day it started. The app, the email and MCP all use this rule.

## Behaviour

- **Start** on an incomplete task card opens `/app/focus`. It creates a running entry with the current limit. If another entry is running, that entry is stopped first and the new one starts (builder's call; a toast says so).
- **Focus screen**: hides the sidebar, navbar and task FAB. It shows the task name, the project, the elapsed time, the limit progress when a limit is set, and Pause/Resume and Stop. Leaving the screen keeps the timer running, and a small navbar chip links back.
- **Limit reached**: the chime plays once per entry, a notification shows when permitted, and the clock switches to an over-limit colour and keeps counting. The limit never stops or shortens the entry. The 24-hour maximum still applies: an entry left running longer is closed at 24 hours.
- **Manual entry**: date, start time and end time, in the account timezone. Overlaps return a clear error.
- **Report page** `/app/time`: a date picker with previous/next day, a project/tag toggle, and a table with group rows (project or tag), task rows, and "Me" and "Everyone" minutes. A task with several tags appears under each tag, and the tag view states that its totals can exceed the day total. The table is plain HTML, so selecting and copying it pastes cleanly into a spreadsheet.
- **Daily email**: `notification-digest-runner` adds the day's totals, grouped by project, for "Me" and "Everyone". The section is omitted when nothing was logged.
- **Projects and tags** are read at report time, so a task moved to another project reports under its current project.

## MCP

New tools with existing scope checks and annotations:

- `get_time_report(from, to, group_by: project|tag|task)`: read-only.
- `list_time_entries(from, to, task_id?)`: read-only, the caller's own entries.
- `create_time_entry`, `update_time_entry`, `delete_time_entry`: the caller's own entries. Deletion is marked destructive.

Shared logic lives in `libs/data-access/tickist`.

## Other updates

- JSON backup export includes the caller's entries. Import accepts them optionally (older backups have none).
- Account deletion cascades entries. Retention keeps them as user content.
- Documentation: `doc/product-features.md`, `llm.txt`, `llm-full.txt`, `doc/data-retention.md`, and the MCP docs.

## Verification

- DB integration script (reuse the disposable-container runner, renamed): RLS isolation, collaborator totals without row access, the one-running rule, the overlap rejection, the trigger total including legacy, timezone day boundaries, refused direct writes to `spent_minutes`, and `infinity` rejection.
- Unit tests for the timer service, the focus screen, the report grouping, and the composer entry list.
- Digest runner tests for the new section.
- MCP tool tests.
- E2E: start from a task card, pause/resume, stop, add a manual entry, and check the day report.

## Owner decisions

- Golden Hour is removed entirely; time entries and focus mode replace it.
- Entries store `started_at` and `ended_at`; durations are computed on read.
- Reaching the limit only alerts (chime, notification, colour change); it never stops the entry.
- Focus mode requires a task.
- Reports and the email show both the owner's time and everyone's total.
- MCP may edit time entries, not only read them.
- No CSV export in v1. Task duplication is a separate feature.

## Builder's calls accepted by the owner

- Starting on another task stops the running entry first and says so.
- Default limit is 50 minutes, the range is 1–600, or no limit.
- Entries of one person cannot overlap. Maximum entry length is 24 hours.
- Existing `spent_minutes` values become undated legacy minutes, counted in task totals but never in day reports.
- Collaborators see only totals, never each other's individual entries.
- Deleting a task deletes its entries. Reports use the task's current project and tags.
- The app report shows one day with previous/next navigation; date ranges are only in MCP.
- Entries are included in the JSON backup. MCP cannot start or stop the timer.

## Implementation notes

- Project access is not inherited by subprojects. Reports therefore roll a task up to the highest project the reader can access, so a member of a shared subproject never sees its parent's name.
- The MCP time tools are available to OAuth clients through `apps/mcp`. Personal `tk_` tokens still reach the frozen Edge Function bridge, which does not get new tools.
- A timer stopped in the same instant it started has no duration and is deleted rather than kept as an empty entry.
- Backups export `spentMinutes` as undated legacy minutes and dated work as `timeEntries`, so a restore does not count time twice. Older backups without `timeEntries` leave existing entries untouched.
