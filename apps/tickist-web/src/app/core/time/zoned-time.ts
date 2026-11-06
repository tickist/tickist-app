// Conversions between UTC instants and wall-clock values in an IANA timezone.

export interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
}

export function zonedDateTimeToIso(
  date: string,
  time: string,
  timezone: string
): string | null {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeParts = /^(\d{2}):(\d{2})$/.exec(time);

  if (!dateParts || !timeParts) {
    return null;
  }

  const year = Number(dateParts[1]);
  const month = Number(dateParts[2]);
  const day = Number(dateParts[3]);
  const hours = Number(timeParts[1]);
  const minutes = Number(timeParts[2]);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hours > 23 ||
    minutes > 59
  ) {
    return null;
  }

  let utcMillis = Date.UTC(year, month - 1, day, hours, minutes);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const zonedParts = getZonedDateParts(new Date(utcMillis), timezone);

    const delta =
      Date.UTC(year, month - 1, day, hours, minutes) -
      Date.UTC(
        zonedParts.year,
        zonedParts.month - 1,
        zonedParts.day,
        zonedParts.hours,
        zonedParts.minutes
      );

    if (delta === 0) {
      return new Date(utcMillis).toISOString();
    }

    utcMillis += delta;
  }

  return new Date(utcMillis).toISOString();
}

export function getZonedDateParts(
  value: Date,
  timezone: string
): ZonedDateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);

  const partValue = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  return {
    year: partValue('year'),
    month: partValue('month'),
    day: partValue('day'),
    hours: partValue('hour'),
    minutes: partValue('minute'),
  };
}

/** Calendar date (YYYY-MM-DD) of an instant in a timezone. */
export function zonedDateKey(value: Date, timezone: string): string {
  const parts = getZonedDateParts(value, timezone);

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** Wall-clock time (HH:mm) of an instant in a timezone. */
export function zonedTimeLabel(value: Date, timezone: string): string {
  const parts = getZonedDateParts(value, timezone);

  return `${pad(parts.hours)}:${pad(parts.minutes)}`;
}

/** Adds whole days to a YYYY-MM-DD key. */
export function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);

  const shifted = new Date(
    Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) + days)
  );

  return shifted.toISOString().slice(0, 10);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
