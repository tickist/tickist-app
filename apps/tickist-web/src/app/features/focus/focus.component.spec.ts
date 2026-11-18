import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixtureHost, requiredElement } from '../../../testing/dom';
import { ToastService } from '../../core/ui/toast.service';
import { ProjectDataService } from '../../data/project-data.service';
import { TaskDataService } from '../../data/task-data.service';
import { TimeTrackingService } from '../../data/time-tracking.service';
import { AppViewStateService } from '../app-shell/app-view-state.service';
import { FocusComponent } from './focus.component';

function setup(
  options: {
    running?: boolean;
    repeatInterval?: number;
    ok?: boolean;
    spentMinutes?: number | null;
    estimateMinutes?: number | null;
  } = {}
) {
  const running = signal(options.running ?? true);

  const task = {
    id: 'task-1',
    name: 'Write the report',
    projectId: null,
    isDone: false,
    repeatInterval: options.repeatInterval ?? 0,
    spentMinutes: options.spentMinutes ?? null,
    estimateMinutes: options.estimateMinutes ?? null,
  };

  const timer = {
    busy: signal(false),
    running: signal(null),
    elapsedSeconds: signal(120),
    limitReached: signal(false),
    focusLimitMinutes: signal(50),
    isRunningTask: () => running(),
    stop: vi.fn(async () => {
      running.set(false);

      return true;
    }),
    start: vi.fn(async () => true),
    todayKey: () => '2026-11-16',
    report: vi.fn(async () => []),
  };

  const tasks = {
    list: signal([task]),
    updateTask: vi.fn(async () =>
      options.ok === false ? null : { ...task, isDone: true }
    ),
  };

  const toasts = { success: vi.fn(), error: vi.fn() };
  const router = { navigateByUrl: vi.fn(async () => true) };

  TestBed.configureTestingModule({
    imports: [FocusComponent],
    providers: [
      { provide: TimeTrackingService, useValue: timer },
      { provide: TaskDataService, useValue: tasks },
      { provide: ProjectDataService, useValue: { list: signal([]) } },
      { provide: ToastService, useValue: toasts },
      { provide: Router, useValue: router },
      {
        provide: AppViewStateService,
        useValue: { lastNonSheetAppUrl: () => '/app/tasks' },
      },
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap({ taskId: 'task-1' })) },
      },
    ],
  });

  const fixture = TestBed.createComponent(FocusComponent);

  fixture.detectChanges();

  return { fixture, timer, tasks, toasts, router };
}

describe('FocusComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('explains each action with a tooltip', () => {
    const { fixture } = setup();
    const host = fixtureHost(fixture);

    for (const id of ['focus-pause', 'focus-complete', 'focus-stop']) {
      expect(
        requiredElement(host, `[data-testid="${id}"]`, HTMLButtonElement).title
      ).not.toBe('');
    }
  });

  it('shows the total time on the task, including the running clock', () => {
    const { fixture } = setup({ spentMinutes: 58, estimateMinutes: 120 });

    // 58 recorded minutes plus 2 running minutes.
    expect(
      requiredElement(
        fixtureHost(fixture),
        '[data-testid="focus-total"]',
        HTMLElement
      ).textContent
    ).toContain('Total on this task: 1 h of 2 h estimated');
  });

  it('shows the recorded total without an estimate while paused', () => {
    const { fixture } = setup({ running: false, spentMinutes: 75 });

    expect(
      requiredElement(
        fixtureHost(fixture),
        '[data-testid="focus-total"]',
        HTMLElement
      ).textContent?.trim()
    ).toBe('Total on this task: 1 h 15 min');
  });

  it('stops the clock, marks the task done and goes back', async () => {
    const { fixture, timer, tasks, toasts, router } = setup();

    requiredElement(
      fixtureHost(fixture),
      '[data-testid="focus-complete"]',
      HTMLButtonElement
    ).click();
    await fixture.whenStable();

    expect(timer.stop).toHaveBeenCalled();
    expect(tasks.updateTask).toHaveBeenCalledWith({
      id: 'task-1',
      isDone: true,
    });
    expect(toasts.success).toHaveBeenCalledWith('Task marked done.');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/tasks');
    expect(timer.stop.mock.invocationCallOrder[0]).toBeLessThan(
      tasks.updateTask.mock.invocationCallOrder[0] ?? 0
    );
  });

  it('completes a paused task without stopping a timer', async () => {
    const { fixture, timer, tasks } = setup({ running: false });

    await fixture.componentInstance.completeTask();

    expect(timer.stop).not.toHaveBeenCalled();
    expect(tasks.updateTask).toHaveBeenCalled();
  });

  it('reports a rescheduled recurring task', async () => {
    const { fixture, toasts } = setup({ repeatInterval: 7 });

    await fixture.componentInstance.completeTask();

    expect(toasts.success).toHaveBeenCalledWith(
      'Task completed and rescheduled.'
    );
  });

  it('stays on the screen when completing fails', async () => {
    const { fixture, toasts, router } = setup({ ok: false });

    await fixture.componentInstance.completeTask();

    expect(toasts.error).toHaveBeenCalledWith('Failed to complete the task.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(fixture.componentInstance.completing()).toBe(false);
  });

  it('does not complete the task when the timer cannot be stopped', async () => {
    const { fixture, timer, tasks } = setup();

    timer.stop.mockResolvedValueOnce(false);
    await fixture.componentInstance.completeTask();

    expect(tasks.updateTask).not.toHaveBeenCalled();
  });
});
