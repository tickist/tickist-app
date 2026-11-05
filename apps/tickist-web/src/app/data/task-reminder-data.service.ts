import { Injectable, inject } from '@angular/core';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { zonedDateTimeToIso } from '../core/time/zoned-time';

export type TaskReminderStatus =
  | 'scheduled'
  | 'processing'
  | 'sent'
  | 'cancelled'
  | 'failed'
  | 'dead';

export interface TaskReminder {
  id: string;
  taskId: string;
  ownerId: string;
  channel: 'email';
  remindAt: string;
  timezone: string;
  status: TaskReminderStatus;
  sentAt?: string | null;
  cancelledAt?: string | null;
}

export interface TaskReminderDraft {
  id?: string | null;
  date: string;
  time: string;
  timezone?: string | null;
}

type TaskReminderRow = {
  id: string;
  task_id: string;
  owner_id: string;
  channel: 'email';
  remind_at: string;
  timezone: string;
  status: TaskReminderStatus;
  sent_at: string | null;
  cancelled_at: string | null;
};

const PENDING_STATUSES: TaskReminderStatus[] = [
  'scheduled',
  'processing',
  'failed',
];

@Injectable({ providedIn: 'root' })
export class TaskReminderDataService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });

  async listForTask(taskId: string): Promise<TaskReminder[]> {
    if (!this.supabase || !taskId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('task_reminders')
      .select(
        'id, task_id, owner_id, channel, remind_at, timezone, status, sent_at, cancelled_at'
      )
      .eq('task_id', taskId)
      .in('status', PENDING_STATUSES)
      .order('remind_at', { ascending: true });

    if (error || !data) {
      throw error ?? new Error('Unable to fetch task reminders.');
    }

    // SAFETY: The reminder projection selects the TaskReminderRow columns from the RLS-protected reminder table.
    return (data as TaskReminderRow[]).map(mapReminderRow);
  }

  async saveForTask(
    taskId: string,
    ownerId: string,
    drafts: TaskReminderDraft[]
  ): Promise<void> {
    if (!this.supabase || !taskId || !ownerId) {
      return;
    }

    const existing = await this.listForTask(taskId);

    const now = new Date();

    const normalizedDrafts = drafts.flatMap((draft) => {
      const normalized = normalizeDraft(draft, now);

      return normalized ? [normalized] : [];
    });

    const keptIds = new Set(
      normalizedDrafts.flatMap((draft) => (draft.id ? [draft.id] : []))
    );

    const idsToCancel = existing
      .filter((reminder) => !keptIds.has(reminder.id))
      .map((reminder) => reminder.id);

    if (idsToCancel.length) {
      const { error } = await this.supabase
        .from('task_reminders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .in('id', idsToCancel)
        .in('status', PENDING_STATUSES);

      if (error) throw error;
    }

    const rows = normalizedDrafts.map((draft) => ({
      id: draft.id,
      task_id: taskId,
      owner_id: ownerId,
      channel: 'email' as const,
      remind_at: draft.remindAt,
      timezone: draft.timezone,
      status: 'scheduled' as const,
      cancelled_at: null,
      sent_at: null,
      last_error: null,
    }));

    if (!rows.length) {
      return;
    }

    const existingRows = rows.filter(
      (row): row is typeof row & { id: string } => row.id !== null
    );

    const newRows = rows.flatMap((row) =>
      row.id === null
        ? [
            {
              task_id: row.task_id,
              owner_id: row.owner_id,
              channel: row.channel,
              remind_at: row.remind_at,
              timezone: row.timezone,
              status: row.status,
              cancelled_at: row.cancelled_at,
              sent_at: row.sent_at,
              last_error: row.last_error,
            },
          ]
        : []
    );

    if (existingRows.length) {
      const { error } = await this.supabase
        .from('task_reminders')
        .upsert(existingRows, { onConflict: 'id' });

      if (error) {
        throw error;
      }
    }

    if (newRows.length) {
      const { error } = await this.supabase
        .from('task_reminders')
        .insert(newRows);

      if (error) {
        throw error;
      }
    }
  }

  async cancelPendingForTask(taskId: string): Promise<void> {
    if (!this.supabase || !taskId) {
      return;
    }

    const { error } = await this.supabase
      .from('task_reminders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('task_id', taskId)
      .in('status', PENDING_STATUSES);

    if (error) {
      console.warn('[TaskReminders] Unable to cancel pending reminders', error);
    }
  }
}

interface NormalizedReminderDraft {
  id: string | null;
  remindAt: string;
  timezone: string;
}

function mapReminderRow(row: TaskReminderRow): TaskReminder {
  return {
    id: row.id,
    taskId: row.task_id,
    ownerId: row.owner_id,
    channel: row.channel,
    remindAt: row.remind_at,
    timezone: row.timezone,
    status: row.status,
    sentAt: row.sent_at,
    cancelledAt: row.cancelled_at,
  };
}

// Only future reminders are valid. A date input passes through past values
// while the year is typed (0002-…, 0020-…, 0202-…), and autosave must never
// store one: the runner would send it at once.
function normalizeDraft(
  draft: TaskReminderDraft,
  now: Date
): NormalizedReminderDraft | null {
  const date = draft.date.trim();
  const time = draft.time.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const timezone = normalizeTimezone(
    draft.timezone ?? resolveBrowserTimezone()
  );

  const remindAt = zonedDateTimeToIso(date, time, timezone);

  if (!remindAt || Date.parse(remindAt) <= now.getTime()) {
    return null;
  }

  return {
    id: draft.id?.trim() || null,
    remindAt,
    timezone,
  };
}

export function isValidTaskReminderDraft(
  draft: TaskReminderDraft,
  now = new Date()
): boolean {
  return normalizeDraft(draft, now) !== null;
}

function normalizeTimezone(value: string): string {
  try {
    return Intl.DateTimeFormat(undefined, { timeZone: value }).resolvedOptions()
      .timeZone;
  } catch {
    return 'UTC';
  }
}

function resolveBrowserTimezone(): string {
  try {
    return normalizeTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return 'UTC';
  }
}
