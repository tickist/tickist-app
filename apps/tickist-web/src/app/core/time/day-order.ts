import { z } from 'zod';

import { shiftDateKey } from './zoned-time';

/**
 * Manual day plan: the order of task IDs the user dragged into place for each
 * calendar day. Stored per browser for now; it may move to Supabase later.
 */
export const DAY_ORDER_STORAGE_KEY = 'tickist.day-order.v1';

/** Plans for days older than this are dropped on the next write. */
const KEEP_PAST_DAYS = 7;

/** Upper bound per day so a corrupted or huge value cannot grow forever. */
const MAX_IDS_PER_DAY = 500;

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

const storedOrdersSchema = z.record(
  z.string().regex(dateKeyPattern),
  z.array(z.string().min(1).max(100)).max(MAX_IDS_PER_DAY)
);

export type DayOrders = z.infer<typeof storedOrdersSchema>;

export function readDayOrders(storage: Storage | undefined): DayOrders {
  try {
    const raw = storage?.getItem(DAY_ORDER_STORAGE_KEY);

    if (!raw) return {};

    const parsed = storedOrdersSchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

/** Saves the plans, dropping days more than a week before today. */
export function writeDayOrders(
  storage: Storage | undefined,
  orders: DayOrders,
  todayKey: string
): DayOrders {
  const oldestKept = shiftDateKey(todayKey, -KEEP_PAST_DAYS);

  const kept = Object.fromEntries(
    Object.entries(orders).filter(
      ([dayKey, ids]) => dayKey >= oldestKept && ids.length > 0
    )
  );

  try {
    storage?.setItem(DAY_ORDER_STORAGE_KEY, JSON.stringify(kept));
  } catch {
    // Private windows or blocked storage: the plan lasts for this page only.
  }

  return kept;
}

/**
 * Orders tasks by the saved plan. Tasks in the plan come first in its order;
 * the rest follow in the fallback order (new tasks land at the end).
 */
export function applyDayOrder<T extends { id: string }>(
  tasks: readonly T[],
  ids: readonly string[] | undefined,
  fallback: (a: T, b: T) => number
): T[] {
  const position = new Map((ids ?? []).map((id, index) => [id, index]));

  return [...tasks].sort((a, b) => {
    const pa = position.get(a.id);
    const pb = position.get(b.id);

    if (pa !== undefined && pb !== undefined) return pa - pb;

    if (pa !== undefined) return -1;

    if (pb !== undefined) return 1;

    return fallback(a, b);
  });
}

/**
 * Moves one visible task and returns the day's new plan. `visibleIds` is the
 * list as shown; IDs saved for tasks not shown here (another section, a
 * filter) keep their relative place after the visible ones.
 */
export function moveInDayOrder(
  savedIds: readonly string[] | undefined,
  visibleIds: readonly string[],
  fromIndex: number,
  toIndex: number
): string[] {
  const moved = [...visibleIds];
  const [item] = moved.splice(fromIndex, 1);

  if (item === undefined) return [...(savedIds ?? visibleIds)];

  moved.splice(Math.max(0, Math.min(toIndex, moved.length)), 0, item);

  const visible = new Set(visibleIds);
  const hidden = (savedIds ?? []).filter((id) => !visible.has(id));

  return [...moved, ...hidden];
}
