import { describe, expect, it } from 'vitest';
import { nextRecurringFinishDate } from './task-lifecycle';

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

  it('uses a future due date as the recurrence anchor', () => {
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
});
