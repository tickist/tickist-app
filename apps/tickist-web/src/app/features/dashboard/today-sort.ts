import { z } from 'zod';

/**
 * Order of the dashboard Today group. `time` and `priority` ignore the day
 * plan; `manual` follows it (the drag-and-drop order shared with Weekdays).
 */
export const TODAY_SORT_OPTIONS = ['time', 'priority', 'manual'] as const;

export type TodaySort = (typeof TODAY_SORT_OPTIONS)[number];

export const DEFAULT_TODAY_SORT: TodaySort = 'time';

export const TODAY_SORT_LABELS: Record<TodaySort, string> = {
  time: 'Time, then priority',
  priority: 'Priority, then time',
  manual: 'My order',
};

/** Per-browser choice for the dashboard Today group. */
export const TODAY_SORT_STORAGE_KEY = 'tickist.today-sort.v1';

const storedSortSchema = z.enum(TODAY_SORT_OPTIONS);

export function readTodaySort(storage: Storage | undefined): TodaySort {
  try {
    const raw = storage?.getItem(TODAY_SORT_STORAGE_KEY);
    const parsed = storedSortSchema.safeParse(raw);

    return parsed.success ? parsed.data : DEFAULT_TODAY_SORT;
  } catch {
    return DEFAULT_TODAY_SORT;
  }
}

export function writeTodaySort(
  storage: Storage | undefined,
  sort: TodaySort
): void {
  try {
    storage?.setItem(TODAY_SORT_STORAGE_KEY, sort);
  } catch {
    // Private windows or blocked storage: the choice lasts for this page only.
  }
}

export function isTodaySort(value: string): value is TodaySort {
  return storedSortSchema.safeParse(value).success;
}
