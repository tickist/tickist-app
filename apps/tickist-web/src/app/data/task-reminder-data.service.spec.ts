import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { TaskReminderDataService } from './task-reminder-data.service';

describe('TaskReminderDataService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-12T10:00:00+02:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('maps task reminder rows for a task', async () => {
    const supabase = createSupabaseMock([
      createReminderRow({
        id: 'reminder-1',
        remind_at: '2026-05-12T07:30:00.000Z',
      }),
    ]);
    TestBed.configureTestingModule({
      providers: [
        TaskReminderDataService,
        { provide: SUPABASE_CLIENT, useValue: supabase },
      ],
    });

    const service = TestBed.inject(TaskReminderDataService);
    const reminders = await service.listForTask('task-1');

    expect(reminders).toEqual([
      expect.objectContaining({
        id: 'reminder-1',
        taskId: 'task-1',
        ownerId: 'owner-1',
        remindAt: '2026-05-12T07:30:00.000Z',
        status: 'scheduled',
      }),
    ]);
  });

  it('cancels removed reminders, upserts existing drafts, and inserts new drafts without ids', async () => {
    const supabase = createSupabaseMock([
      createReminderRow({ id: 'keep-reminder' }),
      createReminderRow({ id: 'remove-reminder' }),
    ]);
    TestBed.configureTestingModule({
      providers: [
        TaskReminderDataService,
        { provide: SUPABASE_CLIENT, useValue: supabase },
      ],
    });

    const service = TestBed.inject(TaskReminderDataService);
    await service.saveForTask('task-1', 'owner-1', [
      {
        id: 'keep-reminder',
        date: '2026-05-12',
        time: '09:30',
        timezone: 'Europe/Warsaw',
      },
      {
        date: '2026-05-13',
        time: '17:45',
        timezone: 'Europe/Warsaw',
      },
    ]);

    expect(supabase.cancelledIds).toEqual(['remove-reminder']);
    expect(supabase.upsertRows).toEqual([
      expect.objectContaining({
        id: 'keep-reminder',
        task_id: 'task-1',
        owner_id: 'owner-1',
        remind_at: '2026-05-12T07:30:00.000Z',
        timezone: 'Europe/Warsaw',
        status: 'scheduled',
      }),
    ]);
    expect(supabase.insertRows).toEqual([
      expect.objectContaining({
        task_id: 'task-1',
        owner_id: 'owner-1',
        remind_at: '2026-05-13T15:45:00.000Z',
        timezone: 'Europe/Warsaw',
        status: 'scheduled',
      }),
    ]);
    expect(supabase.insertRows[0]).not.toHaveProperty('id');
  });
});

function createSupabaseMock(rows: ReturnType<typeof createReminderRow>[]) {
  const cancelledIds: string[] = [];
  const upsertRows: Record<string, unknown>[] = [];
  const insertRows: Record<string, unknown>[] = [];
  return {
    cancelledIds,
    upsertRows,
    insertRows,
    from: vi.fn((table: string) => {
      if (table !== 'task_reminders') {
        throw new Error(`Unexpected table: ${table}`);
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              order: vi.fn(async () => ({ data: rows, error: null })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(async (_column: string, ids: string[]) => {
              cancelledIds.push(...ids);
              return { error: null };
            }),
          })),
          in: vi.fn((_column: string, ids: string[]) => ({
            in: vi.fn(async () => {
              cancelledIds.push(...ids);
              return { error: null };
            }),
          })),
        })),
        upsert: vi.fn(
          async (payload: Record<string, unknown>[]) => {
            upsertRows.push(...payload);
            return { error: null };
          }
        ),
        insert: vi.fn(async (payload: Record<string, unknown>[]) => {
          insertRows.push(...payload);
          return { error: null };
        }),
      };
    }),
  };
}

function createReminderRow(
  overrides: Partial<{
    id: string;
    task_id: string;
    owner_id: string;
    channel: 'email';
    remind_at: string;
    timezone: string;
    status: 'scheduled';
    sent_at: string | null;
    cancelled_at: string | null;
  }> = {}
) {
  return {
    id: 'reminder-1',
    task_id: 'task-1',
    owner_id: 'owner-1',
    channel: 'email' as const,
    remind_at: '2026-05-12T07:30:00.000Z',
    timezone: 'Europe/Warsaw',
    status: 'scheduled' as const,
    sent_at: null,
    cancelled_at: null,
    ...overrides,
  };
}
