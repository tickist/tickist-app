import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { ToastService } from '../core/ui/toast.service';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';
import { TaskDataService } from './task-data.service';
import {
  TimeTrackingService,
  elapsedSecondsAt,
  formatDuration,
  type TimeEntry,
} from './time-tracking.service';

const NOW = Date.parse('2026-11-04T09:00:00.000Z');

type EntryRowFixture = {
  id: string;
  task_id: string;
  started_at: string;
  ended_at: string | null;
  limit_minutes: number | null;
  source: string;
  note: string | null;
  updated_at: string;
};

function entryRow(overrides: Partial<EntryRowFixture> = {}): EntryRowFixture {
  return {
    id: 'entry-1',
    task_id: 'task-1',
    started_at: new Date(NOW).toISOString(),
    ended_at: null,
    limit_minutes: 45,
    source: 'timer',
    note: null,
    updated_at: new Date(NOW).toISOString(),
    ...overrides,
  };
}

describe('time helpers', () => {
  const entry: TimeEntry = {
    id: 'e',
    taskId: 't',
    startedAt: new Date(NOW).toISOString(),
    endedAt: null,
    limitMinutes: null,
    source: 'timer',
    note: null,
  };

  it('measures running and closed entries and caps at 24 hours', () => {
    expect(elapsedSecondsAt(entry, NOW + 90_500)).toBe(90);
    expect(
      elapsedSecondsAt(
        { ...entry, endedAt: new Date(NOW + 600_000).toISOString() },
        NOW + 9_999_999
      )
    ).toBe(600);
    expect(elapsedSecondsAt(entry, NOW + 30 * 3600_000)).toBe(24 * 3600);
  });

  it('formats durations', () => {
    expect(formatDuration(0)).toBe('0 min');
    expect(formatDuration(40 * 60)).toBe('40 min');
    expect(formatDuration(120 * 60)).toBe('2 h');
    expect(formatDuration(85 * 60)).toBe('1 h 25 min');
  });
});

describe('TimeTrackingService', () => {
  const rpcMock = vi.fn();
  const refreshTasks = vi.fn();
  const toast = { info: vi.fn(), error: vi.fn(), success: vi.fn() };
  const userState = signal<User | null>(null);

  const queryChain = {
    select: () => queryChain,
    is: () => queryChain,
    eq: () => queryChain,
    limit: () => queryChain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };

  async function setup(): Promise<TimeTrackingService> {
    TestBed.configureTestingModule({
      providers: [
        TimeTrackingService,
        {
          provide: SUPABASE_CLIENT,
          useValue: { rpc: rpcMock, from: vi.fn(() => queryChain) },
        },
        {
          provide: SupabaseSessionService,
          useValue: { user: userState.asReadonly() },
        },
        {
          provide: TaskDataService,
          useValue: { refresh: refreshTasks, list: () => [] },
        },
        { provide: ToastService, useValue: toast },
      ],
    });
    userState.set({
      id: 'user-1',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-11-01T00:00:00Z',
    } satisfies User);
    const service = TestBed.inject(TimeTrackingService);

    TestBed.flushEffects();
    await service.load();

    return service;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    rpcMock.mockReset();
    refreshTasks.mockReset().mockResolvedValue(undefined);
    Object.values(toast).forEach((mock) => mock.mockReset());
    userState.set(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a timer, counts up and flags the limit', async () => {
    rpcMock.mockResolvedValue({ data: entryRow(), error: null });
    const service = await setup();

    await expect(service.start('task-1')).resolves.toBe(true);
    expect(rpcMock).toHaveBeenCalledWith('time_entry_start', {
      p_task_id: 'task-1',
    });
    expect(service.isRunningTask('task-1')).toBe(true);

    TestBed.flushEffects();
    vi.advanceTimersByTime(44 * 60_000);
    expect(service.elapsedSeconds()).toBe(44 * 60);
    expect(service.limitReached()).toBe(false);

    vi.advanceTimersByTime(60_000);
    expect(service.limitReached()).toBe(true);

    vi.advanceTimersByTime(10 * 60_000);
    expect(service.elapsedSeconds()).toBe(55 * 60);
  });

  it('never flags a limit when the entry has none', async () => {
    rpcMock.mockResolvedValue({
      data: entryRow({ limit_minutes: null }),
      error: null,
    });
    const service = await setup();

    await service.start('task-1');
    TestBed.flushEffects();
    vi.advanceTimersByTime(5 * 3600_000);

    expect(service.limitReached()).toBe(false);
  });

  it('stops the timer and refreshes task totals', async () => {
    rpcMock.mockResolvedValueOnce({ data: entryRow(), error: null });
    const service = await setup();

    await service.start('task-1');
    rpcMock.mockResolvedValueOnce({
      data: entryRow({ ended_at: new Date(NOW + 60_000).toISOString() }),
      error: null,
    });

    await expect(service.stop()).resolves.toBe(true);
    expect(rpcMock).toHaveBeenLastCalledWith('time_entry_stop', {});
    expect(service.running()).toBeNull();
    expect(refreshTasks).toHaveBeenCalled();
  });

  it('keeps the timer when stopping fails', async () => {
    rpcMock.mockResolvedValueOnce({ data: entryRow(), error: null });
    const service = await setup();

    await service.start('task-1');
    rpcMock.mockResolvedValueOnce({ data: null, error: { code: 'XX000' } });

    await expect(service.stop()).resolves.toBe(false);
    expect(service.running()?.id).toBe('entry-1');
    expect(toast.error).toHaveBeenCalled();
  });

  it('says so when starting replaces a timer on another task', async () => {
    rpcMock.mockResolvedValueOnce({ data: entryRow(), error: null });
    const service = await setup();

    await service.start('task-1');
    rpcMock.mockResolvedValueOnce({
      data: entryRow({ id: 'entry-2', task_id: 'task-2' }),
      error: null,
    });

    await service.start('task-2');

    expect(service.isRunningTask('task-2')).toBe(true);
    expect(toast.info).toHaveBeenCalledWith('The previous timer was stopped.');
  });
});
