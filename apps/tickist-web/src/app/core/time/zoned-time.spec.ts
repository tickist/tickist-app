import { describe, expect, it } from 'vitest';
import { draftToRange } from '../../features/task-fab/task-time-entries.component';
import {
  periodLabel,
  periodRange,
  shiftDateKey,
  shiftPeriod,
  zonedDateKey,
  zonedDateTimeToIso,
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
