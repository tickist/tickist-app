import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import {
  TASK_VIEW_STORAGE_KEY,
  TaskViewPreferenceService,
} from './task-view-preference.service';

describe('TaskViewPreferenceService', () => {
  afterEach(() => {
    localStorage.removeItem(TASK_VIEW_STORAGE_KEY);
    TestBed.resetTestingModule();
  });

  it('starts with extended cards on the dashboard and day views', () => {
    const service = TestBed.inject(TaskViewPreferenceService);

    expect(service.dashboard()).toBe('extended');
    expect(service.day()).toBe('extended');
  });

  it('remembers each view separately in this browser', () => {
    TestBed.inject(TaskViewPreferenceService).setSimple('dashboard', true);

    expect(
      JSON.parse(localStorage.getItem(TASK_VIEW_STORAGE_KEY) ?? '{}')
    ).toEqual({ dashboard: 'simple', day: 'extended' });

    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(TaskViewPreferenceService);

    expect(reloaded.dashboard()).toBe('simple');
    expect(reloaded.day()).toBe('extended');
  });

  it('ignores unreadable stored values', () => {
    localStorage.setItem(TASK_VIEW_STORAGE_KEY, '{not json');

    expect(TestBed.inject(TaskViewPreferenceService).day()).toBe('extended');
  });
});
