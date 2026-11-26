import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TODAY_SORT,
  TODAY_SORT_STORAGE_KEY,
  isTodaySort,
  readTodaySort,
  writeTodaySort,
} from './today-sort';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));

  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => data.delete(key),
    setItem: (key, value) => data.set(key, value),
  };
}

describe('Today sort preference', () => {
  it('defaults to time, then priority', () => {
    expect(DEFAULT_TODAY_SORT).toBe('time');
    expect(readTodaySort(undefined)).toBe('time');
    expect(readTodaySort(memoryStorage())).toBe('time');
  });

  it('ignores unknown stored values', () => {
    const storage = memoryStorage({ [TODAY_SORT_STORAGE_KEY]: 'random' });

    expect(readTodaySort(storage)).toBe('time');
  });

  it('remembers the choice', () => {
    const storage = memoryStorage();

    writeTodaySort(storage, 'manual');

    expect(readTodaySort(storage)).toBe('manual');
  });

  it('survives blocked storage', () => {
    const blocked = memoryStorage();

    blocked.getItem = () => {
      throw new Error('blocked');
    };

    blocked.setItem = () => {
      throw new Error('blocked');
    };

    expect(() => writeTodaySort(blocked, 'priority')).not.toThrow();
    expect(readTodaySort(blocked)).toBe('time');
  });

  it('accepts only known options', () => {
    expect(isTodaySort('priority')).toBe(true);
    expect(isTodaySort('alpha')).toBe(false);
  });
});
