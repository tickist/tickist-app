import { describe, expect, it } from 'vitest';

import {
  PROJECT_SORT_STORAGE_KEY,
  readProjectSorts,
  writeProjectSorts,
} from './project-sort';

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

describe('project sort storage', () => {
  it('round-trips the sort chosen for each project', () => {
    const storage = memoryStorage();

    writeProjectSorts(storage, { 'project-1': 'alpha-asc', inbox: 'due-desc' });

    expect(readProjectSorts(storage)).toEqual({
      'project-1': 'alpha-asc',
      inbox: 'due-desc',
    });
  });

  it('ignores missing, malformed or unknown saved values', () => {
    expect(readProjectSorts(memoryStorage())).toEqual({});
    expect(
      readProjectSorts(memoryStorage({ [PROJECT_SORT_STORAGE_KEY]: '{oops' }))
    ).toEqual({});
    expect(
      readProjectSorts(
        memoryStorage({
          [PROJECT_SORT_STORAGE_KEY]: JSON.stringify({ p: 'random-order' }),
        })
      )
    ).toEqual({});
  });

  it('survives storage that throws or is unavailable', () => {
    const blocked = memoryStorage();

    blocked.getItem = () => {
      throw new Error('blocked');
    };

    blocked.setItem = () => {
      throw new Error('blocked');
    };

    expect(readProjectSorts(blocked)).toEqual({});
    expect(() => writeProjectSorts(blocked, { p: 'alpha-asc' })).not.toThrow();
    expect(readProjectSorts(undefined)).toEqual({});
  });
});
