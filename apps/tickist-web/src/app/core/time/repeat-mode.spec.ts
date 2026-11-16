import { describe, expect, it } from 'vitest';

import { repeatFieldsForMode, repeatStateFromTask } from './repeat-mode';

describe('repeat modes', () => {
  it('saves each preset with its unit', () => {
    expect(repeatFieldsForMode('daily', 1, 'day')).toEqual({
      repeatInterval: 1,
      repeatUnit: 'day',
    });
    expect(repeatFieldsForMode('daily_work', 1, 'day')).toEqual({
      repeatInterval: 1,
      repeatUnit: 'workday',
    });
    expect(repeatFieldsForMode('monthly', 5, 'week')).toEqual({
      repeatInterval: 30,
      repeatUnit: 'month',
    });
    expect(repeatFieldsForMode('custom', 3, 'month')).toEqual({
      repeatInterval: 90,
      repeatUnit: 'month',
    });
    expect(repeatFieldsForMode('never', 1, 'day')).toEqual({
      repeatInterval: 0,
      repeatUnit: null,
    });
  });

  it('reopens a workday repeat as "Daily (workweek)", not "Daily"', () => {
    expect(repeatStateFromTask(1, 'workday').mode).toBe('daily_work');
    expect(repeatStateFromTask(1, 'day').mode).toBe('daily');
  });

  it('reads presets, custom repeats and rows saved before units', () => {
    expect(repeatStateFromTask(30, 'month')).toEqual({
      mode: 'monthly',
      every: 1,
      unit: 'month',
    });
    expect(repeatStateFromTask(14, 'week')).toEqual({
      mode: 'custom',
      every: 2,
      unit: 'week',
    });
    expect(repeatStateFromTask(30, 'day')).toEqual({
      mode: 'custom',
      every: 30,
      unit: 'day',
    });
    expect(repeatStateFromTask(365, null).mode).toBe('yearly');
    expect(repeatStateFromTask(0, null).mode).toBe('never');
  });
});
