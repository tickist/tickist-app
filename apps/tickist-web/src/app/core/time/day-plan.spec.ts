import { describe, expect, it } from 'vitest';

import {
  compareDeadlines,
  compareScheduled,
  deadlinesForDay,
  pinnedForToday,
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

  it('shows a deadline only on its due day', () => {
    expect(
      deadlinesForDay(tasks, '2026-11-18', timezone).map((t) => t.id)
    ).toEqual(['deadline-wed']);

    for (const day of ['2026-11-16', '2026-11-17', '2026-11-19']) {
      expect(deadlinesForDay(tasks, day, timezone)).toEqual([]);
    }

    expect(
      deadlinesForDay(tasks, '2026-11-15', timezone).map((t) => t.id)
    ).toEqual(['deadline-sun']);
  });

  it('adds pinned tasks to today unless they are already dated today', () => {
    const pinned = [
      { id: 'undated', finishDate: null, pinned: true },
      dated('later', '2026-11-20', 1, { pinned: true }),
      dated('overdue', '2026-11-10', 0, { pinned: true }),
      dated('today', '2026-11-16', 1, { pinned: true }),
      dated('unpinned', '2026-11-20', 1),
    ];

    expect(
      pinnedForToday(pinned, '2026-11-16', timezone).map((t) => t.id)
    ).toEqual(['undated', 'later', 'overdue']);
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
});
