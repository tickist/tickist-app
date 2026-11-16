/**
 * Task recurrence rules shared by the web app and the MCP server.
 *
 * `tasks.repeat_interval` stays a whole number of days so older clients keep
 * working; `tasks.repeat_unit` says how to read it. A monthly task is stored
 * as 30 days with the unit `month` and advances by calendar months.
 */
export const REPEAT_UNITS = [
  'day',
  'workday',
  'week',
  'month',
  'year',
] as const;

export type RepeatUnit = (typeof REPEAT_UNITS)[number];

export interface RepeatRule {
  every: number;
  unit: RepeatUnit;
}

/** Days stored in `repeat_interval` for one unit. */
export function repeatUnitDays(unit: RepeatUnit): number {
  switch (unit) {
    case 'week':
      return 7;
    case 'month':
      return 30;
    case 'year':
      return 365;
    default:
      return 1;
  }
}

export function isRepeatUnit(
  value: string | null | undefined
): value is RepeatUnit {
  return REPEAT_UNITS.some((unit) => unit === value);
}

/**
 * The unit a bare day count most likely meant. Matches the database trigger
 * that fills `repeat_unit` for writers that only send `repeat_interval`.
 */
export function inferRepeatUnit(intervalDays: number): RepeatUnit {
  if (intervalDays % 365 === 0) return 'year';

  if (intervalDays % 30 === 0) return 'month';

  if (intervalDays % 7 === 0) return 'week';

  return 'day';
}

/** Reads the stored columns; `null` means the task does not repeat. */
export function repeatRuleFromColumns(
  intervalDays: number | null | undefined,
  unit: string | null | undefined
): RepeatRule | null {
  if (!intervalDays || intervalDays <= 0) return null;

  const days = Math.round(intervalDays);
  const resolved = isRepeatUnit(unit) ? unit : inferRepeatUnit(days);

  if (resolved === 'workday') {
    return days === 1
      ? { every: 1, unit: 'workday' }
      : { every: days, unit: 'day' };
  }

  const size = repeatUnitDays(resolved);

  return days % size === 0
    ? { every: days / size, unit: resolved }
    : { every: days, unit: 'day' };
}

/** Stored form of a rule. */
export interface RepeatColumns {
  repeat_interval: number;
  repeat_unit: RepeatUnit | null;
}

/** Columns to store for a rule (or for no repetition). */
export function repeatRuleColumns(rule: RepeatRule | null): RepeatColumns {
  if (!rule) return { repeat_interval: 0, repeat_unit: null };

  const every =
    rule.unit === 'workday' ? 1 : Math.max(1, Math.round(rule.every));

  return {
    repeat_interval: every * repeatUnitDays(rule.unit),
    repeat_unit: rule.unit,
  };
}

/** Advances a `YYYY-MM-DD` calendar date by one repetition of the rule. */
export function advanceDateKey(dateKey: string, rule: RepeatRule): string {
  const every = Math.max(1, Math.round(rule.every));

  switch (rule.unit) {
    case 'workday':
      return addWorkdays(dateKey, every);
    case 'week':
      return addCalendarDays(dateKey, every * 7);
    case 'month':
      return addCalendarMonths(dateKey, every);
    case 'year':
      return addCalendarMonths(dateKey, every * 12);
    default:
      return addCalendarDays(dateKey, every);
  }
}

export function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = parseDateKey(dateKey);

  return formatUtcDate(new Date(Date.UTC(year, month - 1, day + days)));
}

/** Same day of the month, or the month's last day when it is shorter. */
export function addCalendarMonths(dateKey: string, months: number): string {
  const [year, month, day] = parseDateKey(dateKey);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));

  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();

  target.setUTCDate(Math.min(day, lastDay));

  return formatUtcDate(target);
}

/** Moves forward by working days (Monday to Friday). */
export function addWorkdays(dateKey: string, workdays: number): string {
  let current = dateKey;
  let remaining = workdays;

  while (remaining > 0) {
    current = addCalendarDays(current, 1);

    const [year, month, day] = parseDateKey(current);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }

  return current;
}

function parseDateKey(dateKey: string): [number, number, number] {
  const [year = 1970, month = 1, day = 1] = dateKey.split('-').map(Number);

  return [year, month, day];
}

function formatUtcDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
