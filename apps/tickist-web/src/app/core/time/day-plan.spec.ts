import { describe, expect, it } from 'vitest';

import {
  compareDeadlines,
  compareScheduled,
  deadlineHint,
  deadlinesForDay,
  scheduledForDay,
  taskDayKey,
  type DatedTask,
} from './day-plan';
import { zonedDateTimeToIso } from './zoned-time';

const timezone = 'Europe/Warsaw';

function dated(
  id: string,
  date: string,
  type: 0 | 1,
  extra: Partial<DatedTask> = {}
): DatedTask {
  return {
    id,
    finishDate: zonedDateTimeToIso(date, '00:00', timezone),
    typeFinishDate: type,
    ...extra,
  };
}

const today = '2026-11-16';

const tasks = [
  dated('scheduled-mon', '2026-11-16', 0),
  dated('deadline-wed', '2026-11-18', 1),
  dated('deadline-sun', '2026-11-15', 1),
  dated('scheduled-tue', '2026-11-17', 0),
  { id: 'undated', finishDate: null, typeFinishDate: 1 },
];

describe('day plan sections', () => {
  it('keeps scheduled tasks on their own day only', () => {
    expect(
      scheduledForDay(tasks, '2026-11-16', timezone).map((t) => t.id)
    ).toEqual(['scheduled-mon']);
    expect(
      scheduledForDay(tasks, '2026-11-17', timezone).map((t) => t.id)
    ).toEqual(['scheduled-tue']);
  });

  it('shows a deadline on every day from today through its due day', () => {
    for (const day of ['2026-11-16', '2026-11-17', '2026-11-18']) {
      expect(
        deadlinesForDay(tasks, day, today, timezone).map((t) => t.id)
      ).toEqual(['deadline-wed']);
    }

    expect(deadlinesForDay(tasks, '2026-11-19', today, timezone)).toEqual([]);
  });

  it('leaves overdue deadlines and past days to the Overdue group', () => {
    expect(
      deadlinesForDay(tasks, today, today, timezone).map((t) => t.id)
    ).not.toContain('deadline-sun');
    expect(deadlinesForDay(tasks, '2026-11-15', today, timezone)).toEqual([]);
  });

  it('reads the calendar day in the account timezone', () => {
    // 23:30 UTC on the 16th is already the 17th in Warsaw.
    const lateEvening = { id: 'x', finishDate: '2026-11-16T23:30:00Z' };

    expect(taskDayKey(lateEvening, timezone)).toBe('2026-11-17');
    expect(taskDayKey(lateEvening, 'UTC')).toBe('2026-11-16');
    expect(taskDayKey({ id: 'y', finishDate: 'not a date' }, timezone)).toBe(
      null
    );
  });

  it('orders scheduled tasks by time, then priority', () => {
    const list = [
      { id: 'late', finishTime: '15:00', priority: 'A' },
      { id: 'untimed-b', finishTime: null, priority: 'B' },
      { id: 'early', finishTime: '09:00', priority: 'C' },
      { id: 'untimed-a', finishTime: null, priority: 'A' },
    ];

    expect([...list].sort(compareScheduled).map((t) => t.id)).toEqual([
      'early',
      'late',
      'untimed-a',
      'untimed-b',
    ]);
  });

  it('orders deadlines by due date, then priority', () => {
    const list = [
      dated('fri-c', '2026-11-20', 1, { priority: 'C' }),
      dated('wed', '2026-11-18', 1),
      dated('fri-a', '2026-11-20', 1, { priority: 'A' }),
    ];

    expect([...list].sort(compareDeadlines).map((t) => t.id)).toEqual([
      'wed',
      'fri-a',
      'fri-c',
    ]);
  });

  it('describes how far a deadline is from the day shown', () => {
    const wed = dated('wed', '2026-11-18', 1);

    expect(deadlineHint(wed, '2026-11-18', timezone)).toBe('due today');
    expect(deadlineHint(wed, '2026-11-17', timezone)).toBe('due tomorrow');
    expect(deadlineHint(wed, '2026-11-16', timezone)).toBe('due Wed');
    expect(
      deadlineHint(dated('far', '2026-12-01', 1), '2026-11-16', timezone)
    ).toBe('due 1 Dec');
    expect(
      deadlineHint(dated('s', '2026-11-18', 0), '2026-11-16', timezone)
    ).toBeNull();
  });
});
