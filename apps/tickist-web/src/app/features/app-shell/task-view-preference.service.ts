import { Injectable, computed, signal } from '@angular/core';
import { z } from 'zod';

export type TaskViewMode = 'extended' | 'simple';

/** Views without a project, whose card layout is remembered per browser. */
export type TaskViewScope = 'dashboard' | 'day';

type TaskViewPreferences = Record<TaskViewScope, TaskViewMode>;

export const TASK_VIEW_STORAGE_KEY = 'tickist.task-view.v1';

const DEFAULTS: TaskViewPreferences = {
  dashboard: 'extended',
  day: 'extended',
};

/**
 * Simple or extended task cards on the dashboard and the day views. Project
 * views store this choice on the project instead.
 */
@Injectable({ providedIn: 'root' })
export class TaskViewPreferenceService {
  private readonly state = signal<TaskViewPreferences>(readPreferences());

  readonly dashboard = computed(() => this.state().dashboard);
  readonly day = computed(() => this.state().day);

  setSimple(scope: TaskViewScope, simple: boolean): void {
    const next = { ...this.state(), [scope]: simple ? 'simple' : 'extended' };

    this.state.set(next);
    writePreferences(next);
  }
}

function storage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

const ViewModeSchema = z.enum(['extended', 'simple']).catch('extended');

const StoredPreferencesSchema = z.object({
  dashboard: ViewModeSchema.default('extended'),
  day: ViewModeSchema.default('extended'),
});

function readPreferences(): TaskViewPreferences {
  try {
    const raw = storage()?.getItem(TASK_VIEW_STORAGE_KEY);

    if (!raw) return { ...DEFAULTS };

    const parsed = StoredPreferencesSchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function writePreferences(preferences: TaskViewPreferences): void {
  try {
    storage()?.setItem(TASK_VIEW_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage can be full or blocked; the choice still applies this session.
  }
}
