import { z } from 'zod';

export type TimeReportGroupBy = 'project' | 'tag' | 'task';

/** Largest range accepted by `time_report` (migration 0040). */
export const MAX_TIME_RANGE_DAYS = 367;

/** Longest single time entry accepted by the database. */
export const MAX_TIME_ENTRY_MS = 24 * 60 * 60 * 1000;

export const TimeReportRowSchema = z.object({
  work_date: z.string(),
  task_id: z.string(),
  my_seconds: z.coerce.number(),
  everyone_seconds: z.coerce.number(),
});

export type TimeReportRow = z.infer<typeof TimeReportRowSchema>;

export interface ReportTask {
  id: string;
  name: string;
  project_id: string | null;
}

export interface ReportProject {
  id: string;
  name: string;
  ancestor_id: string | null;
}

export interface ReportTag {
  id: string;
  name: string;
}

interface Seconds {
  me: number;
  everyone: number;
}

interface DayMinutes {
  date: string;
  me: number;
  everyone: number;
}

export interface TimeReportTask {
  id: string;
  name: string;
  project?: string;
  me: number;
  everyone: number;
  days: DayMinutes[];
}

export interface TimeReportGroup {
  id: string | null;
  name: string;
  me: number;
  everyone: number;
  days: DayMinutes[];
  tasks?: TimeReportTask[];
}

export interface TimeReport {
  from: string;
  to: string;
  timezone: string;
  group_by: TimeReportGroupBy;
  unit: 'minutes';
  total: { me: number; everyone: number };
  days: DayMinutes[];
  groups: TimeReportGroup[];
}

const NO_PROJECT = 'No project';

const NO_TAG = 'No tag';

const UNKNOWN_TASK = 'Unknown task';

function minutes(seconds: number): number {
  return Math.round(seconds / 60);
}

class SecondsByDay {
  readonly total: Seconds = { me: 0, everyone: 0 };
  private readonly byDay = new Map<string, Seconds>();

  add(row: TimeReportRow): void {
    this.total.me += row.my_seconds;
    this.total.everyone += row.everyone_seconds;

    const day = this.byDay.get(row.work_date) ?? { me: 0, everyone: 0 };
    day.me += row.my_seconds;
    day.everyone += row.everyone_seconds;
    this.byDay.set(row.work_date, day);
  }

  days(): DayMinutes[] {
    return [...this.byDay.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, seconds]) => ({
        date,
        me: minutes(seconds.me),
        everyone: minutes(seconds.everyone),
      }));
  }
}

/**
 * Finds the highest accessible ancestor of a project. Unknown parents (for
 * example a parent the user cannot read) end the walk.
 */
export function rootProjectId(
  projectId: string,
  projects: ReadonlyMap<string, ReportProject>
): string {
  let current = projectId;
  const visited = new Set([current]);

  for (;;) {
    const parentId = projects.get(current)?.ancestor_id;

    if (!parentId || visited.has(parentId) || !projects.has(parentId)) {
      return current;
    }

    visited.add(parentId);
    current = parentId;
  }
}

function byTimeThenName(
  left: { everyone: number; me: number; name: string },
  right: { everyone: number; me: number; name: string }
): number {
  return (
    right.everyone - left.everyone ||
    right.me - left.me ||
    left.name.localeCompare(right.name)
  );
}

/** Groups `time_report` rows into a compact per-group, per-task report. */
export function buildTimeReport(input: {
  from: string;
  to: string;
  timezone: string;
  groupBy: TimeReportGroupBy;
  rows: readonly TimeReportRow[];
  tasks: readonly ReportTask[];
  projects: readonly ReportProject[];
  tagsByTask: ReadonlyMap<string, readonly ReportTag[]>;
}): TimeReport {
  const tasks = new Map(input.tasks.map((task) => [task.id, task]));

  const projects = new Map(
    input.projects.map((project) => [project.id, project])
  );

  const overall = new SecondsByDay();

  const groups = new Map<
    string,
    {
      id: string | null;
      name: string;
      seconds: SecondsByDay;
      tasks: Map<string, SecondsByDay>;
    }
  >();

  const groupsForTask = (
    taskId: string
  ): { id: string | null; name: string }[] => {
    const task = tasks.get(taskId);

    if (input.groupBy === 'task') {
      return [{ id: taskId, name: task?.name ?? UNKNOWN_TASK }];
    }

    if (input.groupBy === 'tag') {
      const tags = input.tagsByTask.get(taskId) ?? [];

      return tags.length > 0
        ? tags.map((tag) => ({ id: tag.id, name: tag.name }))
        : [{ id: null, name: NO_TAG }];
    }

    if (!task?.project_id || !projects.has(task.project_id)) {
      return [{ id: null, name: NO_PROJECT }];
    }

    const rootId = rootProjectId(task.project_id, projects);

    return [{ id: rootId, name: projects.get(rootId)?.name ?? NO_PROJECT }];
  };

  for (const row of input.rows) {
    overall.add(row);

    for (const target of groupsForTask(row.task_id)) {
      const key = target.id ?? '';

      const group = groups.get(key) ?? {
        ...target,
        seconds: new SecondsByDay(),
        tasks: new Map<string, SecondsByDay>(),
      };

      group.seconds.add(row);
      const taskSeconds = group.tasks.get(row.task_id) ?? new SecondsByDay();
      taskSeconds.add(row);
      group.tasks.set(row.task_id, taskSeconds);
      groups.set(key, group);
    }
  }

  const taskSummary = (
    taskId: string,
    seconds: SecondsByDay,
    groupId: string | null
  ): TimeReportTask => {
    const task = tasks.get(taskId);
    const projectId = task?.project_id ?? null;

    // In project grouping the label is needed only for subproject tasks.
    const projectName =
      projectId && (input.groupBy !== 'project' || projectId !== groupId)
        ? projects.get(projectId)?.name
        : undefined;

    const summary: TimeReportTask = {
      id: taskId,
      name: task?.name ?? UNKNOWN_TASK,
      me: minutes(seconds.total.me),
      everyone: minutes(seconds.total.everyone),
      days: seconds.days(),
    };

    if (projectName) summary.project = projectName;

    return summary;
  };

  const reportGroups = [...groups.values()].map((group): TimeReportGroup => {
    if (input.groupBy === 'task') {
      const summary = taskSummary(group.id ?? '', group.seconds, null);

      return { ...summary, id: group.id };
    }

    return {
      id: group.id,
      name: group.name,
      me: minutes(group.seconds.total.me),
      everyone: minutes(group.seconds.total.everyone),
      days: group.seconds.days(),
      tasks: [...group.tasks.entries()]
        .map(([taskId, seconds]) => taskSummary(taskId, seconds, group.id))
        .sort(byTimeThenName),
    };
  });

  return {
    from: input.from,
    to: input.to,
    timezone: input.timezone,
    group_by: input.groupBy,
    unit: 'minutes',
    total: {
      me: minutes(overall.total.me),
      everyone: minutes(overall.total.everyone),
    },
    days: overall.days(),
    groups: reportGroups.sort(byTimeThenName),
  };
}

/** Inclusive number of calendar days between two `YYYY-MM-DD` dates. */
export function inclusiveDays(from: string, to: string): number {
  return (
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86400000 +
    1
  );
}

export function assertTimeRange(from: string, to: string): void {
  const days = inclusiveDays(from, to);

  if (!Number.isFinite(days) || days < 1) {
    throw new Error('to must be on or after from.');
  }

  if (days > MAX_TIME_RANGE_DAYS) {
    throw new Error(
      `The date range can cover at most ${MAX_TIME_RANGE_DAYS} days.`
    );
  }
}

/** Minutes worked; a running entry counts up to now, capped at 24 hours. */
export function entryMinutes(
  startedAt: string,
  endedAt: string | null,
  now = Date.now()
): number {
  const start = Date.parse(startedAt);

  const end =
    endedAt === null
      ? Math.min(now, start + MAX_TIME_ENTRY_MS)
      : Date.parse(endedAt);

  return Math.max(0, Math.round((end - start) / 60000));
}

export function assertEntryInterval(
  startedAt: string | undefined,
  endedAt: string | undefined
): void {
  if (startedAt === undefined || endedAt === undefined) return;

  const duration = Date.parse(endedAt) - Date.parse(startedAt);

  if (duration <= 0) throw new Error('ended_at must be after started_at.');

  if (duration > MAX_TIME_ENTRY_MS) {
    throw new Error('A time entry can last at most 24 hours.');
  }
}

const CHECK_MESSAGES: [string, string][] = [
  ['task_time_entries_order', 'ended_at must be after started_at.'],
  ['task_time_entries_max_length', 'A time entry can last at most 24 hours.'],
  ['task_time_entries_manual_closed', 'A manual time entry needs ended_at.'],
  ['task_time_entries_note_length', 'note can be at most 500 characters.'],
  ['_finite', 'Timestamps must be finite dates.'],
];

/**
 * Converts a PostgREST error from a time-entry write into a message that is
 * safe to show to the client. Database diagnostics are never passed through.
 */
export function timeEntryErrorMessage(
  error: { code?: string; message?: string } | null | undefined,
  fallback: string
): string {
  switch (error?.code) {
    case '23P01':
      return 'This time overlaps another of your time entries.';
    case '22023':
      return 'Time entries cannot start or end in the future.';
    case '22007':
    case '22008':
      return 'Timestamps must be valid ISO 8601 dates with an offset.';
    case '42501':
    case '23503':
      return 'Task not found or not accessible to you.';
    case '23514': {
      const message = error.message ?? '';

      const match = CHECK_MESSAGES.find(([constraint]) =>
        message.includes(constraint)
      );

      return match?.[1] ?? 'The time entry values are not valid.';
    }

    default:
      return fallback;
  }
}
