import {
  repeatRuleColumns,
  repeatRuleFromColumns,
  type RepeatRule,
  type RepeatUnit,
} from '@tickist/recurrence';

/** Repeat choices offered by the task editor and the task card. */
export type RepeatMode =
  | 'never'
  | 'daily'
  | 'daily_work'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

/** Units offered for a custom repeat ("every N …"). */
export type CustomRepeatUnit = 'day' | 'week' | 'month' | 'year';

export interface RepeatState {
  mode: RepeatMode;
  every: number;
  unit: CustomRepeatUnit;
}

const PRESETS = new Map<RepeatMode, RepeatRule>([
  ['daily', { every: 1, unit: 'day' }],
  ['daily_work', { every: 1, unit: 'workday' }],
  ['weekly', { every: 1, unit: 'week' }],
  ['monthly', { every: 1, unit: 'month' }],
  ['yearly', { every: 1, unit: 'year' }],
]);

export function repeatRuleForMode(
  mode: RepeatMode,
  every: number,
  unit: CustomRepeatUnit
): RepeatRule | null {
  if (mode === 'custom') return { every: Math.max(1, Math.round(every)), unit };

  return PRESETS.get(mode) ?? null;
}

export interface RepeatFields {
  repeatInterval: number;
  repeatUnit: RepeatUnit | null;
}

/** Task fields to save for a repeat choice. */
export function repeatFieldsForMode(
  mode: RepeatMode,
  every: number,
  unit: CustomRepeatUnit
): RepeatFields {
  const columns = repeatRuleColumns(repeatRuleForMode(mode, every, unit));

  return {
    repeatInterval: columns.repeat_interval,
    repeatUnit: columns.repeat_unit,
  };
}

/** The editor state for a stored task. */
export function repeatStateFromTask(
  repeatInterval: number | null | undefined,
  repeatUnit: string | null | undefined
): RepeatState {
  const rule = repeatRuleFromColumns(repeatInterval, repeatUnit);

  if (!rule) return { mode: 'never', every: 1, unit: 'day' };

  if (rule.every === 1) {
    for (const [mode, preset] of PRESETS) {
      if (preset.unit === rule.unit)
        return {
          mode,
          every: 1,
          unit: rule.unit === 'workday' ? 'day' : rule.unit,
        };
    }
  }

  return {
    mode: 'custom',
    every: rule.every,
    unit: rule.unit === 'workday' ? 'day' : rule.unit,
  };
}
