import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { StatisticsDataService } from './statistics-data.service';
import { TaskDataService } from './task-data.service';
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

    expect(formatLocalDate(updatePayloads[0]?.['finish_date'])).toBe(
      '2026-05-15'
    );
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

    expect(formatLocalDate(updatePayloads[0]?.['finish_date'])).toBe(
      '2026-05-10'
    );
    expect(updatePayloads[0]).toEqual(
      expect.objectContaining({
        is_done: false,
      })
    );
  });
});

async function setupRecurringTaskService(row: TaskRow): Promise<{
  service: TaskDataService;
  updatePayloads: Record<string, unknown>[];
}> {
  const updatePayloads: Record<string, unknown>[] = [];
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
        provide: TaskReminderDataService,
        useValue: {
          cancelPendingForTask: vi.fn(async () => undefined),
        },
      },
    ],
  });

  const service = TestBed.inject(TaskDataService);
  await service.refresh();
  return { service, updatePayloads };
}

function createSupabaseMock(
  row: TaskRow,
  updatePayloads: Record<string, unknown>[]
) {
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
  updatePayloads: Record<string, unknown>[]
) {
  return {
    select: vi.fn(() => createTasksSelectMock(row, updatePayloads)),
    update: vi.fn((payload: Record<string, unknown>) => {
      updatePayloads.push(payload);
      return {
        eq: vi.fn(async () => ({ error: null })),
      };
    }),
  };
}

function createTasksSelectMock(
  row: TaskRow,
  updatePayloads: Record<string, unknown>[]
) {
  return {
    eq: vi.fn(() => ({
      single: vi.fn(async () => ({
        data: {
          ...row,
          finish_date:
            (updatePayloads.at(-1)?.['finish_date'] as string | null) ??
            row.finish_date,
          is_done:
            (updatePayloads.at(-1)?.['is_done'] as boolean | undefined) ??
            row.is_done,
        },
        error: null,
      })),
    })),
    then: (
      resolve: (value: { data: TaskRow[]; error: null }) => unknown,
      reject: (reason?: unknown) => unknown
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
    ...overrides,
  };
}

function formatLocalDate(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
