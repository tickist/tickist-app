import { describe, expect, it } from 'vitest';

import {
  DAY_ORDER_STORAGE_KEY,
  applyDayOrder,
  moveInDayOrder,
  readDayOrders,
  writeDayOrders,
} from './day-order';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

describe('day order storage', () => {
  it('round-trips plans and drops days older than a week', () => {
    const storage = memoryStorage();

    const kept = writeDayOrders(
      storage,
      {
        '2026-11-16': ['a', 'b'],
        '2026-11-09': ['old'],
        '2026-11-08': ['older'],
        '2026-11-20': [],
      },
      '2026-11-16'
    );

    expect(kept).toEqual({ '2026-11-16': ['a', 'b'], '2026-11-09': ['old'] });
    expect(readDayOrders(storage)).toEqual(kept);
  });

  it('ignores malformed or unexpected saved values', () => {
    expect(readDayOrders(memoryStorage())).toEqual({});
    expect(
      readDayOrders(memoryStorage({ [DAY_ORDER_STORAGE_KEY]: '{oops' }))
    ).toEqual({});
    expect(
      readDayOrders(
        memoryStorage({
          [DAY_ORDER_STORAGE_KEY]: JSON.stringify({ tomorrow: ['a'] }),
        })
      )
    ).toEqual({});
    expect(readDayOrders(undefined)).toEqual({});
  });

  it('keeps working when storage throws', () => {
    const blocked = memoryStorage();

    blocked.setItem = () => {
      throw new Error('blocked');
    };

    expect(
      writeDayOrders(blocked, { '2026-11-16': ['a'] }, '2026-11-16')
    ).toEqual({ '2026-11-16': ['a'] });
  });
});

describe('applying and changing a day plan', () => {
  const tasks = [{ id: 'c' }, { id: 'a' }, { id: 'd' }, { id: 'b' }];

  it('puts planned tasks first and the rest in the fallback order', () => {
    expect(
      applyDayOrder(tasks, ['d', 'b'], byId).map((task) => task.id)
    ).toEqual(['d', 'b', 'a', 'c']);
    expect(applyDayOrder(tasks, undefined, byId).map((t) => t.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('moves a visible task and keeps tasks shown elsewhere in the plan', () => {
    expect(
      moveInDayOrder(['x', 'a', 'y', 'b', 'c'], ['a', 'b', 'c'], 2, 0)
    ).toEqual(['c', 'a', 'b', 'x', 'y']);
    expect(moveInDayOrder(undefined, ['a', 'b', 'c'], 0, 9)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });
});
