import { Injectable, inject } from '@angular/core';
import { SUPABASE_CLIENT } from '../config/supabase.provider';

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
      console.warn('[TaskReminders] Unable to fetch reminders', error);
      return [];
    }

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
    const normalizedDrafts = drafts
      .map((draft) => normalizeDraft(draft))
      .filter((draft): draft is NormalizedReminderDraft => draft !== null);
    const keptIds = new Set(
      normalizedDrafts
        .map((draft) => draft.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    );
    const idsToCancel = existing
      .filter((reminder) => !keptIds.has(reminder.id))
      .map((reminder) => reminder.id);

    if (idsToCancel.length) {
      await this.supabase
        .from('task_reminders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .in('id', idsToCancel)
        .in('status', PENDING_STATUSES);
    }

    const rows = normalizedDrafts.map((draft) => ({
      id: draft.id || undefined,
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

    const { error } = await this.supabase
      .from('task_reminders')
      .upsert(rows, { onConflict: 'id' });
    if (error) {
      throw error;
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

function normalizeDraft(draft: TaskReminderDraft): NormalizedReminderDraft | null {
  const date = draft.date.trim();
  const time = draft.time.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }
  const localDate = new Date(`${date}T${time}:00`);
  if (Number.isNaN(localDate.getTime())) {
    return null;
  }
  return {
    id: draft.id?.trim() || null,
    remindAt: localDate.toISOString(),
    timezone: normalizeTimezone(draft.timezone ?? resolveBrowserTimezone()),
  };
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
