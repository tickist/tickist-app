import { describe, expect, it } from 'vitest';
import { nextRecurringFinishDate } from './task-lifecycle';

describe('nextRecurringFinishDate', () => {
  it('advances from the local completion day', () => {
    expect(
      nextRecurringFinishDate(
        '2026-09-30T22:00:00.000Z',
        7,
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
        7,
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
        1,
        0,
        'Europe/Warsaw',
        new Date('2026-10-24T12:00:00.000Z')
      )
    ).toBe('2026-10-24T22:00:00.000Z');
  });
});
