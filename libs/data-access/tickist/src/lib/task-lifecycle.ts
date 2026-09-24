export function nextRecurringFinishDate(
  finishDate: string | null,
  repeatInterval: number,
  fromRepeating: number | null,
  timezone: string,
  now = new Date()
): string {
  const today = dateKeyInTimezone(now, timezone);
  let base = today;
  if (fromRepeating === 1 && finishDate) {
    const due = dateKeyInTimezone(new Date(finishDate), timezone);
    if (due > today) base = due;
  }
  return startOfZonedDayIso(
    addCalendarDays(base, Math.max(1, Math.round(repeatInterval))),
    timezone
  );
}

function dateKeyInTimezone(date: Date, timezone: string): string {
  const parts = zonedParts(date, timezone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(
    next.getUTCDate()
  )}`;
}

function startOfZonedDayIso(dateKey: string, timezone: string): string {
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
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  let safeTimezone = timezone;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: safeTimezone }).format(date);
  } catch {
    safeTimezone = 'Europe/Warsaw';
  }
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23' as const,
        }
      : {}),
  });
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
