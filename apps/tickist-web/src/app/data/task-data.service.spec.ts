import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { StatisticsDataService } from './statistics-data.service';
import {
  TaskDataService,
  buildDuplicateTaskInput,
  type Task,
} from './task-data.service';
import { TimeTrackingService } from './time-tracking.service';
import { TaskReminderDataService } from './task-reminder-data.service';

type TaskRow = {
  id: string;
  owner_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  finish_date: string | null;
  finish_time: string | null;
  suspend_until: string | null;
  pinned: boolean;
  is_active: boolean;
  is_done: boolean;
  on_hold: boolean;
  type_finish_date: number | null;
  priority: string | null;
  repeat_interval: number | null;
  repeat_delta: number | null;
  from_repeating: number | null;
  estimate_minutes: number | null;
  spent_minutes: number | null;
  task_type: string | null;
  when_complete: string | null;
  creation_date: string | null;
  modification_date: string | null;
  task_tags?: { tag_id: string }[] | null;
  task_steps?:
    | { id: string; content: string; is_done: boolean; position: number }[]
    | null;
  task_reminders?:
    | { id: string; remind_at: string; timezone: string; status: string }[]
    | null;
};

describe('TaskDataService recurring completion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-05-10T12:00:00+02:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reschedules yearly repeating tasks from the due date when configured', async () => {
    const { service, updatePayloads } = await setupRecurringTaskService(
      createTaskRow({
        finish_date: '2025-05-15T00:00:00+00:00',
        from_repeating: 1,
      })
    );

    await service.updateTask({ id: 'task-1', isDone: true });

    // Midnight of 15 May in the account timezone (Europe/Warsaw).
    expect(updatePayloads[0]?.['finish_date']).toBe('2026-05-14T22:00:00.000Z');
    expect(updatePayloads[0]).toEqual(
      expect.objectContaining({
        is_done: false,
      })
    );
  });

  it('reschedules yearly repeating tasks from the completion date when configured', async () => {
    const { service, updatePayloads } = await setupRecurringTaskService(
      createTaskRow({
        finish_date: '2025-05-15T00:00:00+00:00',
        from_repeating: 0,
      })
    );

    await service.updateTask({ id: 'task-1', isDone: true });

    expect(updatePayloads[0]?.['finish_date']).toBe('2026-05-09T22:00:00.000Z');
    expect(updatePayloads[0]).toEqual(
      expect.objectContaining({
        is_done: false,
      })
    );
  });
});

describe('TaskDataService running timer', () => {
  it('stops the timer of a task when it is completed', async () => {
    const { service, stopTimer } = await setupRecurringTaskService(
      createTaskRow({ repeat_interval: 0 }),
      'task-1'
    );

    await service.updateTask({ id: 'task-1', isDone: true });

    expect(stopTimer).toHaveBeenCalledTimes(1);
  });

  it('stops the timer when a recurring task is completed and moves on', async () => {
    const { service, stopTimer } = await setupRecurringTaskService(
      createTaskRow({ finish_date: '2025-05-15T00:00:00+00:00' }),
      'task-1'
    );

    await service.updateTask({ id: 'task-1', isDone: true });

    expect(stopTimer).toHaveBeenCalledTimes(1);
  });

  it('keeps a timer running on another task or for other edits', async () => {
    const other = await setupRecurringTaskService(
      createTaskRow({ repeat_interval: 0 }),
      'task-2'
    );

    await other.service.updateTask({ id: 'task-1', isDone: true });

    expect(other.stopTimer).not.toHaveBeenCalled();

    TestBed.resetTestingModule();

    const same = await setupRecurringTaskService(
      createTaskRow({ repeat_interval: 0 }),
      'task-1'
    );

    await same.service.updateTask({ id: 'task-1', name: 'Renamed' });

    expect(same.stopTimer).not.toHaveBeenCalled();
  });
});

describe('TaskDataService completion time', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-05-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records when a one-off task is completed', async () => {
    const { service, updatePayloads } = await setupRecurringTaskService(
      createTaskRow({ repeat_interval: 0 })
    );

    await service.updateTask({ id: 'task-1', isDone: true });

    expect(updatePayloads[0]).toEqual(
      expect.objectContaining({
        is_done: true,
        when_complete: '2025-05-10T12:00:00.000Z',
      })
    );
  });

  it('clears the completion time when a task is reopened', async () => {
    const { service, updatePayloads } = await setupRecurringTaskService(
      createTaskRow({
        repeat_interval: 0,
        is_done: true,
        when_complete: '2025-05-09T08:00:00Z',
      })
    );

    await service.updateTask({ id: 'task-1', isDone: false });

    expect(updatePayloads[0]).toEqual(
      expect.objectContaining({ is_done: false, when_complete: null })
    );
  });

  it('leaves the completion time alone for other edits and recurring completions', async () => {
    const oneOff = await setupRecurringTaskService(
      createTaskRow({ repeat_interval: 0 })
    );

    await oneOff.service.updateTask({ id: 'task-1', name: 'Renamed' });
    expect(oneOff.updatePayloads[0]).not.toHaveProperty('when_complete');

    TestBed.resetTestingModule();

    const recurring = await setupRecurringTaskService(createTaskRow());

    await recurring.service.updateTask({ id: 'task-1', isDone: true });
    expect(recurring.updatePayloads[0]).not.toHaveProperty('when_complete');
  });
});

async function setupRecurringTaskService(
  row: TaskRow,
  runningTaskId: string | null = null
): Promise<{
  service: TaskDataService;
  updatePayloads: Partial<TaskRow>[];
  stopTimer: ReturnType<typeof vi.fn>;
}> {
  const updatePayloads: Partial<TaskRow>[] = [];
  const stopTimer = vi.fn(async () => true);
  const supabase = createSupabaseMock(row, updatePayloads);

  TestBed.configureTestingModule({
    providers: [
      TaskDataService,
      {
        provide: SUPABASE_CLIENT,
        useValue: supabase,
      },
      {
        provide: StatisticsDataService,
        useValue: {
          markDirty: vi.fn(),
        },
      },
      {
        provide: TimeTrackingService,
        useValue: {
          timezone: () => 'Europe/Warsaw',
          isRunningTask: (taskId: string) => taskId === runningTaskId,
          stop: stopTimer,
        },
      },
      {
        provide: TaskReminderDataService,
        useValue: {
          cancelPendingForTask: vi.fn(async () => undefined),
        },
      },
    ],
  });

  const service = TestBed.inject(TaskDataService);
  await service.refresh();

  return { service, updatePayloads, stopTimer };
}

function createSupabaseMock(row: TaskRow, updatePayloads: Partial<TaskRow>[]) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'tasks') {
        return createTasksTableMock(row, updatePayloads);
      }

      if (table === 'task_steps') {
        return createTaskStepsTableMock();
      }

      if (table === 'task_tags') {
        return createTaskTagsTableMock();
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function createTasksTableMock(
  row: TaskRow,
  updatePayloads: Partial<TaskRow>[]
) {
  return {
    select: vi.fn(() => createTasksSelectMock(row, updatePayloads)),
    update: vi.fn((payload: Partial<TaskRow>) => {
      updatePayloads.push(payload);

      return {
        eq: vi.fn(async () => ({ error: null })),
      };
    }),
  };
}

function createTasksSelectMock(
  row: TaskRow,
  updatePayloads: Partial<TaskRow>[]
) {
  return {
    eq: vi.fn(() => ({
      single: vi.fn(async () => ({
        data: {
          ...row,
          finish_date:
            updatePayloads.at(-1)?.['finish_date'] ?? row.finish_date,
          is_done: updatePayloads.at(-1)?.['is_done'] ?? row.is_done,
        },
        error: null,
      })),
    })),
    // oxlint-disable-next-line unicorn/no-thenable -- Supabase query mocks are intentionally thenable.
    then: (
      resolve: (value: { data: TaskRow[]; error: null }) => void,
      reject: (cause?: unknown) => void
    ) => Promise.resolve({ data: [row], error: null }).then(resolve, reject),
  };
}

function createTaskStepsTableMock() {
  return {
    delete: vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null })),
    })),
    insert: vi.fn(async () => ({ error: null })),
  };
}

function createTaskTagsTableMock() {
  return {
    delete: vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null })),
    })),
    insert: vi.fn(async () => ({ error: null })),
  };
}

function createTaskRow(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id: 'task-1',
    owner_id: 'owner-1',
    project_id: 'project-1',
    name: 'Annual task',
    description: '',
    finish_date: '2025-05-15T00:00:00+00:00',
    finish_time: null,
    suspend_until: null,
    pinned: false,
    is_active: true,
    is_done: false,
    on_hold: false,
    type_finish_date: 1,
    priority: 'B',
    repeat_interval: 365,
    repeat_delta: null,
    from_repeating: 0,
    estimate_minutes: null,
    spent_minutes: null,
    task_type: 'NORMAL',
    when_complete: null,
    creation_date: null,
    modification_date: null,
    task_tags: [],
    task_steps: [],
    task_reminders: [],
    ...overrides,
  };
}

describe('buildDuplicateTaskInput', () => {
  const source: Task = {
    id: 'task-1',
    ownerId: 'owner-1',
    projectId: 'project-1',
    name: 'Write report',
    description: 'Quarterly numbers',
    finishDate: '2026-11-10',
    finishTime: '10:00',
    typeFinishDate: 0,
    suspendUntil: '2026-11-08T08:00:00.000Z',
    pinned: true,
    isActive: false,
    isDone: true,
    onHold: true,
    priority: 'A',
    repeatInterval: 7,
    repeatUnit: 'week',
    repeatDelta: 1,
    fromRepeating: 1,
    estimateMinutes: 90,
    spentMinutes: 45,
    taskType: 'next_action',
    whenComplete: '2026-11-05T10:00:00.000Z',
    reminderCount: 1,
    reminders: [
      {
        id: 'reminder-1',
        remindAt: '2026-11-10T08:00:00.000Z',
        timezone: 'Europe/Warsaw',
        status: 'pending',
      },
    ],
    tags: ['tag-1'],
    assigneeIds: ['user-2'],
    steps: [
      {
        id: 's2',
        taskId: 'task-1',
        content: 'Send',
        isDone: false,
        position: 5,
      },
      {
        id: 's1',
        taskId: 'task-1',
        content: 'Draft',
        isDone: true,
        position: 2,
      },
    ],
  };

  it('keeps the work description and starts the copy fresh', () => {
    const input = buildDuplicateTaskInput(source, 'me');

    expect(input).toEqual({
      ownerId: 'me',
      name: 'Write report',
      projectId: 'project-1',
      description: 'Quarterly numbers',
      finishDate: '2026-11-10',
      finishTime: '10:00',
      typeFinishDate: 0,
      priority: 'A',
      repeatInterval: 7,
      repeatUnit: 'week',
      fromRepeating: 1,
      estimateMinutes: 90,
      taskType: 'next_action',
      tags: ['tag-1'],
      assigneeIds: ['user-2'],
      steps: [
        { content: 'Draft', position: 0, isDone: false },
        { content: 'Send', position: 1, isDone: false },
      ],
    });
  });

  it('does not share arrays with the source task', () => {
    const input = buildDuplicateTaskInput(source, 'me');

    expect(input.tags).not.toBe(source.tags);
    expect(input.assigneeIds).not.toBe(source.assigneeIds);
  });
});
