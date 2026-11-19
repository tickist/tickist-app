import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';
import { TaskOccurrenceDataService } from './task-occurrence-data.service';

type CompletionInsert = { task_id: string; due_date: string | null };

const row = {
  id: 'completion-1',
  task_id: 'task-1',
  owner_id: 'user-1',
  completed_at: '2026-11-19T08:00:00Z',
  due_date: '2026-11-19T00:00:00Z',
  spent_minutes: 25,
};

function setup(insertResult: { data: unknown; error: unknown }) {
  const inserted: CompletionInsert[] = [];
  const filters: [string, string, string][] = [];

  const selectQuery = {
    eq: (column: string, value: string) => {
      filters.push(['eq', column, value]);

      return selectQuery;
    },
    gte: (column: string, value: string) => {
      filters.push(['gte', column, value]);

      return selectQuery;
    },
    order: async () => ({ data: [row], error: null }),
  };

  const supabase = {
    from: vi.fn(() => ({
      select: () => selectQuery,
      insert: (payload: CompletionInsert) => {
        inserted.push(payload);

        return { select: () => ({ single: async () => insertResult }) };
      },
    })),
  };

  TestBed.configureTestingModule({
    providers: [
      { provide: SUPABASE_CLIENT, useValue: supabase },
      {
        provide: SupabaseSessionService,
        useValue: { user: signal({ id: 'user-1' }) },
      },
    ],
  });

  return {
    service: TestBed.inject(TaskOccurrenceDataService),
    inserted,
    filters,
  };
}

describe('TaskOccurrenceDataService', () => {
  it("loads the signed-in person's recent completions", async () => {
    const { service, filters } = setup({ data: null, error: null });

    await service.refresh();

    expect(filters).toContainEqual(['eq', 'owner_id', 'user-1']);
    expect(service.recent()).toEqual([
      {
        id: 'completion-1',
        taskId: 'task-1',
        ownerId: 'user-1',
        completedAt: '2026-11-19T08:00:00Z',
        dueDate: '2026-11-19T00:00:00Z',
        spentMinutes: 25,
      },
    ]);
  });

  it('records a completion with only the task and due date', async () => {
    const { service, inserted } = setup({
      data: { ...row, id: 'completion-2' },
      error: null,
    });

    await expect(
      service.record('task-1', '2026-11-19T00:00:00Z')
    ).resolves.toBe(true);
    expect(inserted).toEqual([
      { task_id: 'task-1', due_date: '2026-11-19T00:00:00Z' },
    ]);
    expect(service.recent()[0]?.id).toBe('completion-2');
  });

  it('reports a failed recording', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { service } = setup({ data: null, error: { message: 'denied' } });

    await expect(service.record('task-1', null)).resolves.toBe(false);
  });
});
