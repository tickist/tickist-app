# Product features

## Product promise

Tickist gives projects, priorities, and deadlines one calm home. The intended user outcome is not merely storing tasks; it is knowing which next action deserves attention.

## Public blog

Tickist has a public, responsive blog for visitors who are not signed in. The blog indexes are available in English (`/en/blog`) and Polish (`/pl/blog`). Each language has an independent editorial catalogue: posts are not automatically translated or paired across languages.

Posts, categories, and tags are published from the repository rather than an administration panel. The initial blog has no articles and no comments. Future public article pages may offer social sharing using their canonical URL.

## Inbox and projects

- Each account has one Inbox for uncategorised tasks.
- Projects can be nested to represent outcomes and their component work.
- Projects have names, descriptions, colours, icons, defaults, and a simple or extended task-card view.
- The sidebar groups active work and special planning buckets such as Someday/Maybe, routine reminders, weekdays, and future work.
- Project owners can share a project by invitation. Recipients accept or decline from the Team view; accepted members can leave shared projects.

## Tasks

### Capture and structure

Tasks hold a title, description, project, priority, type, due date/time, estimated and spent time, tags, assignees, subtasks, and reminders. Quick entry is available within task lists; full create/edit flows expose the wider task model.

### Status and completion

Open, completed, and all-task filters are available in project task lists. Completing a task records its completion timestamp; reopening it clears the timestamp. When completed tasks are visible, the card displays a `Completed DD-MM-YYYY` badge next to the task name.

### Ordering and filtering

Project task lists support sorting by:

- priority, ascending or descending;
- due date, ascending or descending;
- creation date, ascending or descending;
- modification date, ascending or descending;
- name, A–Z or Z–A.

Tag views support tag selection, OR/AND matching, untagged-task mode, completed-task inclusion, search, pagination, and the same core ordering choices.

### Repeating tasks and reminders

Tasks support daily, workday, weekly, monthly, yearly, and custom recurrence. Completing a recurring task creates the next occurrence rather than leaving an ordinary completed item. Reminders store a date, time, timezone, and delivery state.

## Focus views

- **Dashboard:** today, overdue, pinned, next-action, and need-info work; project next-action coverage.
- **Task tree:** project-oriented task grouping for scanning a wider workspace.
- **Statistics:** completed work, late completions, overdue open work, and inactive projects over a time window.
- **Tags:** cross-project filtering and ordering.

## Settings and portability

Settings cover profile data, avatar, password changes, email notification preferences, backup/restore, and API tokens. Export/import uses stable IDs and modification timestamps to make data transfer and duplicate handling reliable.

## Notifications

Users can receive daily or weekly email summaries according to timezone-aware preferences. Task reminders and notification digests use a database-backed email outbox and server-side workers; the browser does not send SES email directly.
