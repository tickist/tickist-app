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
    const newRows = rows
      .filter((row) => row.id === null)
      .map((row) => ({
        task_id: row.task_id,
        owner_id: row.owner_id,
        channel: row.channel,
        remind_at: row.remind_at,
        timezone: row.timezone,
        status: row.status,
        cancelled_at: row.cancelled_at,
        sent_at: row.sent_at,
        last_error: row.last_error,
      }));

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

function normalizeDraft(draft: TaskReminderDraft): NormalizedReminderDraft | null {
  const date = draft.date.trim();
  const time = draft.time.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }
  const timezone = normalizeTimezone(draft.timezone ?? resolveBrowserTimezone());
  const remindAt = zonedDateTimeToIso(date, time, timezone);
  if (!remindAt) {
    return null;
  }
  return {
    id: draft.id?.trim() || null,
    remindAt,
    timezone,
  };
}

function zonedDateTimeToIso(
  date: string,
  time: string,
  timezone: string
): string | null {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeParts = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateParts || !timeParts) {
    return null;
  }

  const year = Number(dateParts[1]);
  const month = Number(dateParts[2]);
  const day = Number(dateParts[3]);
  const hours = Number(timeParts[1]);
  const minutes = Number(timeParts[2]);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hours > 23 ||
    minutes > 59
  ) {
    return null;
  }

  let utcMillis = Date.UTC(year, month - 1, day, hours, minutes);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const zonedParts = getZonedDateParts(new Date(utcMillis), timezone);
    const delta =
      Date.UTC(
        year,
        month - 1,
        day,
        hours,
        minutes
      ) -
      Date.UTC(
        zonedParts.year,
        zonedParts.month - 1,
        zonedParts.day,
        zonedParts.hours,
        zonedParts.minutes
      );
    if (delta === 0) {
      return new Date(utcMillis).toISOString();
    }
    utcMillis += delta;
  }

  return new Date(utcMillis).toISOString();
}

function getZonedDateParts(
  value: Date,
  timezone: string
): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);

  const partValue = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  return {
    year: partValue('year'),
    month: partValue('month'),
    day: partValue('day'),
    hours: partValue('hour'),
    minutes: partValue('minute'),
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
