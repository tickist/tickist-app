// Which tasks belong to a calendar day in the Weekdays view and the dashboard.
// A task date is either Scheduled (typeFinishDate 0: do it on that day) or a
// Deadline (any other value, the default: finish it by that day).
import { zonedDateKey } from './zoned-time';

export interface DatedTask {
  id: string;
  finishDate?: string | null;
  finishTime?: string | null;
  typeFinishDate?: number | null;
  priority?: string | null;
  pinned?: boolean | null;
}

/** typeFinishDate of a Scheduled task; anything else is a Deadline. */
export const SCHEDULED_TYPE_FINISH_DATE = 0;

export function isScheduled(task: DatedTask): boolean {
  return task.typeFinishDate === SCHEDULED_TYPE_FINISH_DATE;
}

/** Calendar day (YYYY-MM-DD) of the task's date in the account timezone. */
export function taskDayKey(task: DatedTask, timezone: string): string | null {
  if (!task.finishDate) return null;

  const date = new Date(task.finishDate);

  return Number.isNaN(date.getTime()) ? null : zonedDateKey(date, timezone);
}

/** Tasks scheduled on exactly this day. */
export function scheduledForDay<T extends DatedTask>(
  tasks: readonly T[],
  dayKey: string,
  timezone: string
): T[] {
  return tasks.filter(
    (task) => isScheduled(task) && taskDayKey(task, timezone) === dayKey
  );
}

/**
 * Pinned tasks belong to today. Those not already dated today (undated,
 * overdue or due later) join today's plan; the rest stay in their section.
 */
export function pinnedForToday<T extends DatedTask>(
  tasks: readonly T[],
  todayKey: string,
  timezone: string
): T[] {
  return tasks.filter(
    (task) => !!task.pinned && taskDayKey(task, timezone) !== todayKey
  );
}

/** Deadlines due on exactly this day. */
export function deadlinesForDay<T extends DatedTask>(
  tasks: readonly T[],
  dayKey: string,
  timezone: string
): T[] {
  return tasks.filter(
    (task) => !isScheduled(task) && taskDayKey(task, timezone) === dayKey
  );
}

const PRIORITY_RANK = new Map([
  ['A', 3],
  ['B', 2],
  ['C', 1],
]);

function priorityRank(task: DatedTask): number {
  return PRIORITY_RANK.get((task.priority ?? '').toUpperCase()) ?? 0;
}

/** Default order before a manual plan exists: time of day, then priority. */
export function compareScheduled(a: DatedTask, b: DatedTask): number {
  const byTime = (a.finishTime || '99:99').localeCompare(
    b.finishTime || '99:99'
  );

  return byTime || priorityRank(b) - priorityRank(a);
}

/** Default order for deadlines: soonest due first, then priority. */
export function compareDeadlines(a: DatedTask, b: DatedTask): number {
  const byDue = (a.finishDate ?? '').localeCompare(b.finishDate ?? '');

  return byDue || priorityRank(b) - priorityRank(a);
}
