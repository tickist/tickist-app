import { advanceDateKey, type RepeatRule } from './recurrence';

/** Upper bound on catch-up steps for a long-overdue task. */
const MAX_CATCH_UP_STEPS = 10_000;

/**
 * Next due date of a recurring task, as midnight in the account timezone.
 * A task that repeats from its completion date counts from the completion
 * day. A task that repeats from its task date keeps its cadence: the next date
 * is the first occurrence after today, counted from the task date.
 */
export function nextRecurringFinishDate(
  finishDate: string | null,
  rule: RepeatRule,
  fromRepeating: number | null,
  timezone: string,
  now = new Date()
): string {
  const today = dateKeyInTimezone(now, timezone);

  if (fromRepeating !== 1 || !finishDate) {
    return startOfZonedDayIso(advanceDateKey(today, rule), timezone);
  }

  const anchor = finishDateKey(finishDate, timezone);

  if (!anchor) {
    return startOfZonedDayIso(advanceDateKey(today, rule), timezone);
  }

  return startOfZonedDayIso(
    firstOccurrenceAfter(anchor, rule, today),
    timezone
  );
}

/**
 * Steps from the anchor until the date is after today. Calendar steps are
 * counted from the anchor itself, so month-end dates do not drift
 * (31 January → 28 February → 31 March).
 */
function firstOccurrenceAfter(
  anchor: string,
  rule: RepeatRule,
  today: string
): string {
  const every = Math.max(1, Math.round(rule.every));
  let next = advanceDateKey(anchor, rule);

  for (let step = 2; next <= today && step <= MAX_CATCH_UP_STEPS; step += 1) {
    next =
      rule.unit === 'workday'
        ? advanceDateKey(next, rule)
        : advanceDateKey(anchor, { ...rule, every: every * step });
  }

  return next > today ? next : advanceDateKey(today, rule);
}

/**
 * Calendar day of a stored task date in the account timezone. A date-only
 * value is returned unchanged. An exact UTC midnight is an older date-only
 * write that Postgres stored as UTC, so its UTC day is used. Returns an empty
 * string for a missing or invalid value.
 */
export function finishDateKey(
  value: string | null | undefined,
  timezone: string
): string {
  const trimmed = value?.trim();

  if (!trimmed) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) return '';

  if (
    parsed.getUTCHours() === 0 &&
    parsed.getUTCMinutes() === 0 &&
    parsed.getUTCSeconds() === 0 &&
    parsed.getUTCMilliseconds() === 0
  ) {
    return parsed.toISOString().slice(0, 10);
  }

  return dateKeyInTimezone(parsed, timezone);
}

function dateKeyInTimezone(date: Date, timezone: string): string {
  const parts = zonedParts(date, timezone);

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function startOfZonedDayIso(dateKey: string, timezone: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const target = Date.UTC(year, month - 1, day);
  let candidate = target;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = zonedParts(new Date(candidate), timezone, true);

    const observed = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );

    const correction = target - observed;
    candidate += correction;

    if (correction === 0) break;
  }

  return new Date(candidate).toISOString();
}

function zonedParts(
  date: Date,
  timezone: string,
  includeTime = false
): ZonedParts {
  let safeTimezone = timezone;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: safeTimezone }).format(date);
  } catch {
    safeTimezone = 'Europe/Warsaw';
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: safeTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  if (includeTime)
    Object.assign(options, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

  const formatter = new Intl.DateTimeFormat('en-CA', options);

  const values = new Map(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: values.get('year') ?? 1970,
    month: values.get('month') ?? 1,
    day: values.get('day') ?? 1,
    hour: values.get('hour') ?? 0,
    minute: values.get('minute') ?? 0,
    second: values.get('second') ?? 0,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}
