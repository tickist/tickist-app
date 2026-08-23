import { describe, expect, test } from 'vitest';

import { Task } from './task-data.service';
import {
  isTaskSuspended,
  taskMatchesStatusFilter,
} from './task-status.service';

describe('task suspension status', () => {
  const now = Date.parse('2026-08-23T12:00:00.000Z');

  test('treats indefinite and future suspensions as suspended', () => {
    expect(isTaskSuspended(createTask({ isActive: false }), now)).toBe(true);
    expect(
      isTaskSuspended(
        createTask({
          isActive: false,
          suspendUntil: '2026-08-23T12:01:00.000Z',
        }),
        now
      )
    ).toBe(true);
  });

  test('treats an expired suspension as active while the cron update catches up', () => {
    expect(
      isTaskSuspended(
        createTask({
          isActive: false,
          suspendUntil: '2026-08-23T11:59:00.000Z',
        }),
        now
      )
    ).toBe(false);
  });

  test('keeps active open, suspended, completed, and all filters separate', () => {
    const active = createTask();
    const suspended = createTask({ isActive: false });
    const done = createTask({ isDone: true });

    expect(taskMatchesStatusFilter(active, 'not-done', now)).toBe(true);
    expect(taskMatchesStatusFilter(suspended, 'not-done', now)).toBe(false);
    expect(taskMatchesStatusFilter(suspended, 'suspended', now)).toBe(true);
    expect(taskMatchesStatusFilter(done, 'done', now)).toBe(true);
    expect(taskMatchesStatusFilter(suspended, 'all', now)).toBe(true);
  });
});

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    ownerId: 'owner-1',
    projectId: 'project-1',
    name: 'Task',
    description: '',
    finishDate: null,
    finishTime: null,
    typeFinishDate: 1,
    suspendUntil: null,
    pinned: false,
    isActive: true,
    isDone: false,
    onHold: false,
    priority: 'B',
    repeatInterval: 0,
    repeatDelta: null,
    fromRepeating: null,
    estimateMinutes: null,
    spentMinutes: null,
    taskType: 'normal',
    whenComplete: null,
    reminderCount: 0,
    reminders: [],
    tags: [],
    assigneeIds: [],
    steps: [],
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}
