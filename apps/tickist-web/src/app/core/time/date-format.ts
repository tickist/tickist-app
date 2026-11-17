import { Pipe, PipeTransform } from '@angular/core';

/**
 * One date style for the whole app: day before month, month as a word
 * ("17 Nov", "17 Nov 2027", "Tuesday 17 November").
 */
const LOCALE = 'en-GB';

type DateInput = Date | string | number | null | undefined;

export interface DateFormatOptions {
  /** IANA zone used to pick the calendar day; the browser zone otherwise. */
  timeZone?: string | null;
  /** Reference "now" for deciding whether the year is shown. */
  now?: Date;
}

/** "17 Nov", or "17 Nov 2027" outside the current year. */
export function formatDay(
  value: DateInput,
  options: DateFormatOptions = {}
): string | null {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  const timeZone = zoneOrUndefined(options.timeZone);

  const sameYear =
    yearIn(date, timeZone) === yearIn(options.now ?? new Date(), timeZone);

  return format(date, {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
    timeZone,
  });
}

/** "17 Nov 2026, 14:05". */
export function formatDateTime(
  value: DateInput,
  options: DateFormatOptions = {}
): string | null {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  return format(date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: zoneOrUndefined(options.timeZone),
  });
}

/** "Tuesday 17 November" for a YYYY-MM-DD key. */
export function formatDayKeyLong(dateKey: string): string | null {
  const date = dateKeyToUtc(dateKey);

  return date
    ? format(date, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      })
    : null;
}

/** "November 2026" for a YYYY-MM key. */
export function formatMonthKey(monthKey: string): string | null {
  const date = dateKeyToUtc(`${monthKey}-01`);

  return date
    ? format(date, { month: 'long', year: 'numeric', timeZone: 'UTC' })
    : null;
}

/** `{{ value | appDate }}` → "17 Nov"; `{{ value | appDate: 'dateTime' }}`. */
@Pipe({ name: 'appDate' })
export class AppDatePipe implements PipeTransform {
  transform(value: DateInput, style: 'day' | 'dateTime' = 'day'): string {
    return (
      (style === 'dateTime' ? formatDateTime(value) : formatDay(value)) ?? ''
    );
  }
}

function format(date: Date, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(LOCALE, options).format(date);
  } catch {
    return new Intl.DateTimeFormat(LOCALE, {
      ...options,
      timeZone: undefined,
    }).format(date);
  }
}

function yearIn(date: Date, timeZone: string | undefined): string {
  return format(date, { year: 'numeric', timeZone });
}

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKeyToUtc(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);

  if (!match) {
    return null;
  }

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function zoneOrUndefined(timeZone: string | null | undefined) {
  return timeZone?.trim() || undefined;
}
