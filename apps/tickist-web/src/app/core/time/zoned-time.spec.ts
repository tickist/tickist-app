import { describe, expect, it } from 'vitest';
import { draftToRange } from '../../features/task-fab/task-time-entries.component';
import {
  dateKeysInRange,
  dueDayStatus,
  periodLabel,
  periodRange,
  shiftDateKey,
  shiftPeriod,
  zonedDateKey,
  zonedDateTimeToIso,
  weekdayLabel,
  zonedTimeLabel,
} from './zoned-time';

describe('zoned time helpers', () => {
  it('converts wall-clock time in a timezone to UTC across DST', () => {
    expect(zonedDateTimeToIso('2026-11-04', '10:00', 'Europe/Warsaw')).toBe(
      '2026-11-04T09:00:00.000Z'
    );
    expect(zonedDateTimeToIso('2026-07-04', '10:00', 'Europe/Warsaw')).toBe(
      '2026-07-04T08:00:00.000Z'
    );
  });

  it('reads the calendar day and time in the account timezone', () => {
    const lateUtc = new Date('2026-11-04T23:30:00.000Z');

    expect(zonedDateKey(lateUtc, 'Europe/Warsaw')).toBe('2026-11-05');
    expect(zonedTimeLabel(lateUtc, 'Europe/Warsaw')).toBe('00:30');
    expect(zonedDateKey(lateUtc, 'UTC')).toBe('2026-11-04');
  });

  it('shifts date keys across month ends', () => {
    expect(shiftDateKey('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftDateKey('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('report periods', () => {
  it('spans Monday to Sunday and whole calendar months', () => {
    // 2026-11-04 is a Wednesday.
    expect(periodRange('2026-11-04', 'day')).toEqual({
      from: '2026-11-04',
      to: '2026-11-04',
    });
    expect(periodRange('2026-11-04', 'week')).toEqual({
      from: '2026-11-02',
      to: '2026-11-08',
    });
    expect(periodRange('2026-11-08', 'week').from).toBe('2026-11-02');
    expect(periodRange('2026-02-14', 'month')).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
  });

  it('moves by whole periods across month and year ends', () => {
    expect(shiftPeriod('2026-11-04', 'week', -1)).toBe('2026-10-28');
    expect(shiftPeriod('2026-01-31', 'month', -1)).toBe('2025-12-01');
    expect(shiftPeriod('2026-12-15', 'month', 1)).toBe('2027-01-01');
  });

  it('labels weeks and months', () => {
    expect(periodLabel(periodRange('2026-11-04', 'week'), 'week')).toMatch(
      /^2\s–\s8 Nov 2026$/
    );
    expect(periodLabel(periodRange('2026-11-04', 'month'), 'month')).toBe(
      'November 2026'
    );
  });

  it('lists the days of a week for column headers', () => {
    const days = dateKeysInRange(periodRange('2026-11-04', 'week'));

    expect(days).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]);
    expect(weekdayLabel(days[0] ?? '')).toBe('Mon 2');
    expect(dateKeysInRange({ from: '2026-12-31', to: '2027-01-01' })).toEqual([
      '2026-12-31',
      '2027-01-01',
    ]);
  });
});

describe('draftToRange', () => {
  it('builds a same-day range', () => {
    expect(
      draftToRange(
        { date: '2026-11-04', from: '10:00', to: '10:40' },
        'Europe/Warsaw'
      )
    ).toEqual({
      startedAt: '2026-11-04T09:00:00.000Z',
      endedAt: '2026-11-04T09:40:00.000Z',
    });
  });

  it('treats an earlier end as work past midnight', () => {
    expect(
      draftToRange(
        { date: '2026-11-04', from: '23:30', to: '00:15' },
        'Europe/Warsaw'
      )
    ).toEqual({
      startedAt: '2026-11-04T22:30:00.000Z',
      endedAt: '2026-11-04T23:15:00.000Z',
    });
  });

  it('rejects incomplete drafts', () => {
    expect(
      draftToRange({ date: '2026-11-04', from: '10:00', to: '' }, 'UTC')
    ).toBeNull();
  });
});

describe('dueDayStatus', () => {
  const timezone = 'Europe/Warsaw';
  const now = new Date('2026-11-16T14:30:00Z');

  const at = (date: string, time: string): string => {
    const iso = zonedDateTimeToIso(date, time, timezone);

    if (!iso) throw new Error(`invalid test date ${date} ${time}`);

    return iso;
  };

  it('treats a task due at the start of today as due today, not overdue', () => {
    const startOfToday = at('2026-11-16', '00:00');

    expect(dueDayStatus(startOfToday, now, timezone)).toBe('today');
  });

  it('marks earlier days as overdue and later days as upcoming', () => {
    const yesterday = at('2026-11-15', '23:30');
    const tomorrow = at('2026-11-17', '00:00');

    expect(dueDayStatus(yesterday, now, timezone)).toBe('overdue');
    expect(dueDayStatus(tomorrow, now, timezone)).toBe('upcoming');
  });

  it('compares calendar days in the account timezone', () => {
    // 23:30 UTC on 16 November is already 17 November in Warsaw.
    const lateEvening = new Date('2026-11-16T23:30:00Z');
    const dueSeventeenthUtc = '2026-11-17T00:00:00Z';

    expect(dueDayStatus(dueSeventeenthUtc, lateEvening, timezone)).toBe(
      'today'
    );
    expect(dueDayStatus(dueSeventeenthUtc, lateEvening, 'UTC')).toBe(
      'upcoming'
    );
  });
});
