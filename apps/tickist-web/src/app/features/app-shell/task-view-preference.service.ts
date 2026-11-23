import { Injectable, computed, signal } from '@angular/core';

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

function readPreferences(): TaskViewPreferences {
  try {
    const raw = storage()?.getItem(TASK_VIEW_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;

    if (!parsed || typeof parsed !== 'object') return { ...DEFAULTS };

    const record = parsed as Partial<Record<TaskViewScope, unknown>>;

    return {
      dashboard: record.dashboard === 'simple' ? 'simple' : 'extended',
      day: record.day === 'simple' ? 'simple' : 'extended',
    };
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
