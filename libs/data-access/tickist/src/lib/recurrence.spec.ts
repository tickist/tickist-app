import { describe, expect, it } from 'vitest';

import {
  addCalendarMonths,
  addWorkdays,
  advanceDateKey,
  inferRepeatUnit,
  repeatRuleColumns,
  repeatRuleFromColumns,
} from './recurrence';

describe('recurrence rules', () => {
  it('reads stored columns, inferring the unit for rows without one', () => {
    expect(repeatRuleFromColumns(0, null)).toBeNull();
    expect(repeatRuleFromColumns(30, null)).toEqual({
      every: 1,
      unit: 'month',
    });
    expect(repeatRuleFromColumns(730, null)).toEqual({
      every: 2,
      unit: 'year',
    });
    expect(repeatRuleFromColumns(14, 'week')).toEqual({
      every: 2,
      unit: 'week',
    });
    expect(repeatRuleFromColumns(30, 'day')).toEqual({
      every: 30,
      unit: 'day',
    });
    expect(repeatRuleFromColumns(1, 'workday')).toEqual({
      every: 1,
      unit: 'workday',
    });
  });

  it('falls back to days when the unit does not fit the interval', () => {
    expect(repeatRuleFromColumns(10, 'week')).toEqual({
      every: 10,
      unit: 'day',
    });
    expect(repeatRuleFromColumns(7, 'workday')).toEqual({
      every: 7,
      unit: 'day',
    });
    expect(repeatRuleFromColumns(5, 'fortnight')).toEqual({
      every: 5,
      unit: 'day',
    });
  });

  it('stores whole days plus the unit', () => {
    expect(repeatRuleColumns({ every: 3, unit: 'month' })).toEqual({
      repeat_interval: 90,
      repeat_unit: 'month',
    });
    expect(repeatRuleColumns({ every: 4, unit: 'workday' })).toEqual({
      repeat_interval: 1,
      repeat_unit: 'workday',
    });
    expect(repeatRuleColumns(null)).toEqual({
      repeat_interval: 0,
      repeat_unit: null,
    });
  });

  it('matches the database inference', () => {
    expect([1, 7, 14, 30, 60, 365, 10].map(inferRepeatUnit)).toEqual([
      'day',
      'week',
      'week',
      'month',
      'month',
      'year',
      'day',
    ]);
  });
});

describe('advancing dates', () => {
  it('keeps the day of the month, or uses the last day of a shorter month', () => {
    expect(addCalendarMonths('2026-01-15', 1)).toBe('2026-02-15');
    expect(addCalendarMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addCalendarMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addCalendarMonths('2026-11-30', 3)).toBe('2027-02-28');
    expect(addCalendarMonths('2026-12-05', 1)).toBe('2027-01-05');
  });

  it('moves yearly tasks to the same date, Feb 29 to Feb 28', () => {
    expect(advanceDateKey('2026-05-15', { every: 1, unit: 'year' })).toBe(
      '2027-05-15'
    );
    expect(advanceDateKey('2028-02-29', { every: 1, unit: 'year' })).toBe(
      '2029-02-28'
    );
  });

  it('skips weekends for working days', () => {
    // 2026-11-13 is a Friday, 2026-11-14 a Saturday.
    expect(addWorkdays('2026-11-13', 1)).toBe('2026-11-16');
    expect(addWorkdays('2026-11-14', 1)).toBe('2026-11-16');
    expect(addWorkdays('2026-11-16', 1)).toBe('2026-11-17');
    expect(addWorkdays('2026-11-12', 3)).toBe('2026-11-17');
  });

  it('advances weeks and days by calendar days', () => {
    expect(advanceDateKey('2026-12-28', { every: 1, unit: 'week' })).toBe(
      '2027-01-04'
    );
    expect(advanceDateKey('2026-02-27', { every: 3, unit: 'day' })).toBe(
      '2026-03-02'
    );
  });
});
