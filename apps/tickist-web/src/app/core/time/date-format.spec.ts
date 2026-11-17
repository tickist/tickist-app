import { describe, expect, test } from 'vitest';
import {
  AppDatePipe,
  formatDateTime,
  formatDay,
  formatDayKeyLong,
  formatMonthKey,
} from './date-format';

const now = new Date('2026-11-17T10:00:00.000Z');

describe('date format', () => {
  test('shows day and month, adding the year only outside the current one', () => {
    expect(formatDay('2026-11-20T09:00:00.000Z', { now })).toBe('20 Nov');
    expect(formatDay('2027-01-05T09:00:00.000Z', { now })).toBe('5 Jan 2027');
  });

  test('uses the account timezone to pick the calendar day', () => {
    const lateEvening = '2026-11-17T23:30:00.000Z';

    expect(formatDay(lateEvening, { timeZone: 'Europe/Warsaw', now })).toBe(
      '18 Nov'
    );
    expect(formatDay(lateEvening, { timeZone: 'America/New_York', now })).toBe(
      '17 Nov'
    );
    expect(formatDay(lateEvening, { timeZone: 'Not/AZone', now })).toMatch(
      /^1[78] Nov$/
    );
  });

  test('formats date and time, day keys and months the same way', () => {
    expect(
      formatDateTime('2026-11-17T13:05:00.000Z', { timeZone: 'UTC' })
    ).toBe('17 Nov 2026, 13:05');
    expect(formatDayKeyLong('2026-11-17')).toBe('Tuesday 17 November');
    expect(formatMonthKey('2026-12')).toBe('December 2026');
  });

  test('returns nothing for missing or invalid input', () => {
    expect(formatDay(null)).toBeNull();
    expect(formatDay('')).toBeNull();
    expect(formatDay('not a date')).toBeNull();
    expect(formatDayKeyLong('2026-1-7')).toBeNull();
    expect(new AppDatePipe().transform(undefined)).toBe('');
  });
});
