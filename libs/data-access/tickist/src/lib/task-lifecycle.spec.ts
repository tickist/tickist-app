import { describe, expect, it } from 'vitest';
import { finishDateKey, nextRecurringFinishDate } from './task-lifecycle';

describe('nextRecurringFinishDate', () => {
  it('advances from the local completion day', () => {
    expect(
      nextRecurringFinishDate(
        '2026-09-30T22:00:00.000Z',
        { every: 1, unit: 'week' },
        0,
        'Europe/Warsaw',
        new Date('2026-09-21T22:30:00.000Z')
      )
    ).toBe('2026-09-28T22:00:00.000Z');
  });

  it('counts from a future task date', () => {
    expect(
      nextRecurringFinishDate(
        '2026-09-30T22:00:00.000Z',
        { every: 1, unit: 'week' },
        1,
        'Europe/Warsaw',
        new Date('2026-09-21T10:00:00.000Z')
      )
    ).toBe('2026-10-07T22:00:00.000Z');
  });

  it('keeps local midnight across the daylight-saving boundary', () => {
    expect(
      nextRecurringFinishDate(
        null,
        { every: 1, unit: 'day' },
        0,
        'Europe/Warsaw',
        new Date('2026-10-24T12:00:00.000Z')
      )
    ).toBe('2026-10-24T22:00:00.000Z');
  });

  it('repeats monthly on the same calendar day in the account timezone', () => {
    // Completed on 31 January in Warsaw (23:30 UTC on the 30th).
    expect(
      nextRecurringFinishDate(
        null,
        { every: 1, unit: 'month' },
        0,
        'Europe/Warsaw',
        new Date('2026-01-30T23:30:00.000Z')
      )
    ).toBe('2026-02-27T23:00:00.000Z');
  });

  it('moves a workday task done on Friday to Monday', () => {
    expect(
      nextRecurringFinishDate(
        null,
        { every: 1, unit: 'workday' },
        0,
        'Europe/Warsaw',
        new Date('2026-11-13T15:00:00.000Z')
      )
    ).toBe('2026-11-15T23:00:00.000Z');
  });

  it('counts from a past task date instead of the completion day', () => {
    // Weekly, due 21 November, completed on 23 November in Warsaw.
    expect(
      nextRecurringFinishDate(
        '2026-11-20T23:00:00.000Z',
        { every: 1, unit: 'week' },
        1,
        'Europe/Warsaw',
        new Date('2026-11-23T10:00:00.000Z')
      )
    ).toBe('2026-11-27T23:00:00.000Z');
  });

  it('skips to the first occurrence after today when long overdue', () => {
    expect(
      nextRecurringFinishDate(
        '2026-10-31T23:00:00.000Z',
        { every: 1, unit: 'week' },
        1,
        'Europe/Warsaw',
        new Date('2026-11-23T10:00:00.000Z')
      )
    ).toBe('2026-11-28T23:00:00.000Z');
  });

  it('does not land on today when an occurrence falls on it', () => {
    expect(
      nextRecurringFinishDate(
        '2026-11-15T23:00:00.000Z',
        { every: 1, unit: 'week' },
        1,
        'Europe/Warsaw',
        new Date('2026-11-23T10:00:00.000Z')
      )
    ).toBe('2026-11-29T23:00:00.000Z');
  });

  it('moves a task due today by one interval', () => {
    expect(
      nextRecurringFinishDate(
        '2026-11-22T23:00:00.000Z',
        { every: 1, unit: 'week' },
        1,
        'Europe/Warsaw',
        new Date('2026-11-23T10:00:00.000Z')
      )
    ).toBe('2026-11-29T23:00:00.000Z');
  });

  it('keeps the month-end day when catching up a monthly task', () => {
    // Due 31 January, completed 5 March: February is skipped, 31 March kept.
    expect(
      nextRecurringFinishDate(
        '2026-01-30T23:00:00.000Z',
        { every: 1, unit: 'month' },
        1,
        'Europe/Warsaw',
        new Date('2026-03-05T10:00:00.000Z')
      )
    ).toBe('2026-03-30T22:00:00.000Z');
  });

  it('catches up an overdue workday task', () => {
    // Due Friday 13 November, completed Wednesday 18 November.
    expect(
      nextRecurringFinishDate(
        '2026-11-12T23:00:00.000Z',
        { every: 1, unit: 'workday' },
        1,
        'Europe/Warsaw',
        new Date('2026-11-18T10:00:00.000Z')
      )
    ).toBe('2026-11-18T23:00:00.000Z');
  });

  it('reads an older UTC-midnight task date as its calendar day', () => {
    expect(
      nextRecurringFinishDate(
        '2026-11-21T00:00:00+00:00',
        { every: 1, unit: 'week' },
        1,
        'America/New_York',
        new Date('2026-11-23T15:00:00.000Z')
      )
    ).toBe('2026-11-28T05:00:00.000Z');
  });
});

describe('finishDateKey', () => {
  it('reads midnight in the account timezone as that day', () => {
    expect(finishDateKey('2026-11-29T23:00:00.000Z', 'Europe/Warsaw')).toBe(
      '2026-11-30'
    );
  });

  it('reads an exact UTC midnight as its UTC day', () => {
    expect(finishDateKey('2026-05-11T00:00:00+00:00', 'Europe/Warsaw')).toBe(
      '2026-05-11'
    );
    expect(finishDateKey('2026-05-11T00:00:00+00:00', 'America/New_York')).toBe(
      '2026-05-11'
    );
  });

  it('keeps a date-only value and rejects invalid input', () => {
    expect(finishDateKey('2026-06-03', 'Europe/Warsaw')).toBe('2026-06-03');
    expect(finishDateKey('not-a-date', 'Europe/Warsaw')).toBe('');
    expect(finishDateKey(null, 'Europe/Warsaw')).toBe('');
  });
});
