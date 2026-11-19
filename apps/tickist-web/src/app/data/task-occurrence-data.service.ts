import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';

/** One completed occurrence of a recurring task. */
export interface TaskOccurrenceCompletion {
  id: string;
  taskId: string;
  ownerId: string;
  completedAt: string;
  /** Due date of the occurrence that was completed. */
  dueDate: string | null;
  /** Time spent on that occurrence, by everyone, in minutes. */
  spentMinutes: number | null;
}

type CompletionRow = {
  id: string;
  task_id: string;
  owner_id: string;
  completed_at: string;
  due_date: string | null;
  spent_minutes: number | null;
};

const COMPLETION_SELECT =
  'id, task_id, owner_id, completed_at, due_date, spent_minutes';

/** Long enough to cover "today" in any timezone. */
const RECENT_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Completing a recurring task keeps it open with the next date, so the
 * completion itself is stored as a task occurrence. This service records them
 * and keeps the signed-in person's recent ones for "Done today".
 */
@Injectable({ providedIn: 'root' })
export class TaskOccurrenceDataService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly session = inject(SupabaseSessionService);
  private readonly recentCompletions = signal<TaskOccurrenceCompletion[]>([]);
  private loadedUserId: string | null = null;

  /** The signed-in person's completions from the last two days. */
  readonly recent = this.recentCompletions.asReadonly();

  constructor() {
    effect(() => {
      const user = this.session.user();

      if (!user) {
        this.loadedUserId = null;
        this.recentCompletions.set([]);

        return;
      }

      if (this.loadedUserId === user.id) return;
      this.loadedUserId = user.id;
      untracked(() => {
        void this.refresh();
      });
    });
  }

  async refresh(): Promise<void> {
    const userId = this.session.user()?.id;

    if (!this.supabase || !userId) return;

    const since = new Date(Date.now() - RECENT_WINDOW_MS).toISOString();

    const { data, error } = await this.supabase
      .from('task_occurrence_completions')
      .select(COMPLETION_SELECT)
      .eq('owner_id', userId)
      .gte('completed_at', since)
      .order('completed_at', { ascending: false });

    if (error || !data) {
      console.warn('[Occurrences] Unable to load completions.', error);

      return;
    }

    // SAFETY: COMPLETION_SELECT lists the CompletionRow columns; this assertion stays at the untyped Supabase query boundary.
    this.recentCompletions.set((data as CompletionRow[]).map(toCompletion));
  }

  /**
   * Records that the occurrence due on `dueDate` was completed. The database
   * dates it and totals its time; a failure is logged and does not undo the
   * completion itself.
   */
  async record(taskId: string, dueDate: string | null): Promise<boolean> {
    if (!this.supabase) return false;

    const { data, error } = await this.supabase
      .from('task_occurrence_completions')
      .insert({ task_id: taskId, due_date: dueDate })
      .select(COMPLETION_SELECT)
      .single();

    if (error || !data) {
      console.error('[Occurrences] Failed to record a completion', error);

      return false;
    }

    // SAFETY: COMPLETION_SELECT lists the CompletionRow columns; this assertion stays at the untyped Supabase query boundary.
    const completion = toCompletion(data as CompletionRow);

    this.recentCompletions.update((current) => [completion, ...current]);

    return true;
  }
}

function toCompletion(row: CompletionRow): TaskOccurrenceCompletion {
  return {
    id: row.id,
    taskId: row.task_id,
    ownerId: row.owner_id,
    completedAt: row.completed_at,
    dueDate: row.due_date,
    spentMinutes: row.spent_minutes,
  };
}
