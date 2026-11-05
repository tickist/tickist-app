import {
  DestroyRef,
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { z } from 'zod';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { ToastService } from '../core/ui/toast.service';
import { zonedDateKey } from '../core/time/zoned-time';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';
import { TaskDataService } from './task-data.service';

export const FOCUS_LIMIT_DEFAULT_MINUTES = 50;

export const FOCUS_LIMIT_MIN_MINUTES = 1;

export const FOCUS_LIMIT_MAX_MINUTES = 600;

export const DEFAULT_ACCOUNT_TIMEZONE = 'Europe/Warsaw';

const MAX_ENTRY_SECONDS = 24 * 3600;

const TICK_MS = 1000;

const ENTRY_COLUMNS =
  'id, task_id, started_at, ended_at, limit_minutes, source, note, updated_at';

export interface TimeEntry {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  limitMinutes: number | null;
  source: 'timer' | 'manual';
  note: string | null;
}

export interface TimeEntryInput {
  taskId: string;
  startedAt: string;
  endedAt: string;
  note?: string | null;
}

export interface TimeReportRow {
  workDate: string;
  taskId: string;
  mySeconds: number;
  everyoneSeconds: number;
}

const EntryRowSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  limit_minutes: z.number().nullable(),
  source: z.enum(['timer', 'manual']),
  note: z.string().nullable(),
  updated_at: z.string().optional(),
});

const ReportRowSchema = z.object({
  work_date: z.string(),
  task_id: z.string(),
  my_seconds: z.coerce.number(),
  everyone_seconds: z.coerce.number(),
});

const AccountRowSchema = z.object({
  focus_limit_minutes: z.number().nullable(),
  timezone: z.string().nullable(),
});

type EntryRow = z.infer<typeof EntryRowSchema>;

@Injectable({ providedIn: 'root' })
export class TimeTrackingService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly session = inject(SupabaseSessionService);
  private readonly tasks = inject(TaskDataService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly runningState = signal<TimeEntry | null>(null);
  private readonly limitState = signal<number | null>(
    FOCUS_LIMIT_DEFAULT_MINUTES
  );
  private readonly timezoneState = signal(DEFAULT_ACCOUNT_TIMEZONE);
  private readonly busyState = signal(false);
  private readonly nowMs = signal(Date.now());
  /** Server clock minus browser clock, learned from write responses. */
  private serverOffsetMs = 0;
  private alertedEntryId: string | null = null;
  private audioContext: AudioContext | null = null;
  private loadedUserId: string | null = null;

  readonly running = this.runningState.asReadonly();
  readonly focusLimitMinutes = this.limitState.asReadonly();
  readonly timezone = this.timezoneState.asReadonly();
  readonly busy = this.busyState.asReadonly();

  readonly elapsedSeconds = computed(() => {
    const entry = this.runningState();

    return entry
      ? elapsedSecondsAt(entry, this.nowMs() + this.serverOffsetMs)
      : 0;
  });

  readonly limitReached = computed(() => {
    const entry = this.runningState();

    return (
      entry?.limitMinutes != null &&
      this.elapsedSeconds() >= entry.limitMinutes * 60
    );
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect((onCleanup) => {
      if (!this.runningState() || !this.isBrowser) return;
      const timer = setInterval(() => this.nowMs.set(Date.now()), TICK_MS);

      this.nowMs.set(Date.now());
      onCleanup(() => clearInterval(timer));
    });

    effect(() => {
      const entry = this.runningState();

      if (!entry || !this.limitReached()) return;

      if (this.alertedEntryId === entry.id) return;
      this.alertedEntryId = entry.id;
      untracked(() => this.announceLimit(entry));
    });

    effect(() => {
      const user = this.session.user();

      if (!user) {
        this.reset();

        return;
      }

      if (this.loadedUserId === user.id) return;
      this.loadedUserId = user.id;
      untracked(() => {
        void this.load();
      });
    });

    destroyRef.onDestroy(() => {
      void this.audioContext?.close();
    });
  }

  isRunningTask(taskId: string): boolean {
    return this.runningState()?.taskId === taskId;
  }

  todayKey(): string {
    return zonedDateKey(
      new Date(this.nowMs() + this.serverOffsetMs),
      this.timezoneState()
    );
  }

  async load(): Promise<void> {
    await Promise.all([this.loadRunning(), this.loadAccount()]);
  }

  /** Starts the timer on a task; a timer on another task stops first. */
  async start(taskId: string): Promise<boolean> {
    const previous = this.runningState();

    if (previous?.taskId === taskId) return true;
    this.prepareAlerts();

    const { ok, entry } = await this.callTimerRpc('time_entry_start', {
      p_task_id: taskId,
    });

    if (!ok || !entry) return false;
    this.runningState.set(entry);
    this.alertedEntryId = null;

    if (previous) {
      this.toast.info('The previous timer was stopped.');
      void this.tasks.refresh();
    }

    return true;
  }

  async stop(): Promise<boolean> {
    if (!this.runningState()) return true;
    const { ok } = await this.callTimerRpc('time_entry_stop', {});

    if (!ok) return false;
    this.runningState.set(null);
    this.alertedEntryId = null;
    await this.tasks.refresh();

    return true;
  }

  async saveFocusLimit(minutes: number | null): Promise<boolean> {
    const user = this.session.user();

    if (!this.supabase || !user) return false;

    if (minutes !== null && !isValidLimit(minutes)) return false;

    const { error } = await this.supabase
      .from('app_users')
      .update({ focus_limit_minutes: minutes })
      .eq('auth_user_id', user.id);

    if (error) {
      console.warn('[TimeTracking] Unable to save the focus limit.', error);

      return false;
    }

    this.limitState.set(minutes);

    return true;
  }

  async listTaskEntries(taskId: string): Promise<TimeEntry[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('task_time_entries')
      .select(ENTRY_COLUMNS)
      .eq('task_id', taskId)
      .order('started_at', { ascending: false })
      .limit(200);

    if (error || !Array.isArray(data)) {
      console.warn('[TimeTracking] Unable to load time entries.', error);

      return [];
    }

    return parseEntries(data);
  }

  async createEntry(input: TimeEntryInput): Promise<boolean> {
    if (!this.supabase) return false;

    const { error } = await this.supabase.from('task_time_entries').insert({
      task_id: input.taskId,
      started_at: input.startedAt,
      ended_at: input.endedAt,
      note: input.note?.trim() || null,
    });

    return this.afterEntryWrite(error);
  }

  async updateEntry(id: string, input: TimeEntryInput): Promise<boolean> {
    if (!this.supabase) return false;

    const { error } = await this.supabase
      .from('task_time_entries')
      .update({
        task_id: input.taskId,
        started_at: input.startedAt,
        ended_at: input.endedAt,
        note: input.note?.trim() || null,
      })
      .eq('id', id);

    return this.afterEntryWrite(error);
  }

  async deleteEntry(id: string): Promise<boolean> {
    if (!this.supabase) return false;

    const { error } = await this.supabase
      .from('task_time_entries')
      .delete()
      .eq('id', id);

    return this.afterEntryWrite(error);
  }

  async report(fromKey: string, toKey = fromKey): Promise<TimeReportRow[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase.rpc('time_report', {
      p_from: fromKey,
      p_to: toKey,
    });

    if (error || !Array.isArray(data)) {
      console.warn('[TimeTracking] Unable to load the time report.', error);
      this.toast.error('The time report could not be loaded.');

      return [];
    }

    return data.flatMap((row) => {
      const parsed = ReportRowSchema.safeParse(row);

      return parsed.success
        ? [
            {
              workDate: parsed.data.work_date,
              taskId: parsed.data.task_id,
              mySeconds: parsed.data.my_seconds,
              everyoneSeconds: parsed.data.everyone_seconds,
            },
          ]
        : [];
    });
  }

  private async afterEntryWrite(
    error: { code?: string; message?: string } | null
  ): Promise<boolean> {
    if (error) {
      this.toast.error(entryErrorMessage(error.code));

      return false;
    }

    await this.tasks.refresh();

    return true;
  }

  private async callTimerRpc(
    name: 'time_entry_start' | 'time_entry_stop',
    args: { p_task_id?: string }
  ): Promise<{ ok: boolean; entry: TimeEntry | null }> {
    if (!this.supabase) return { ok: false, entry: null };
    this.busyState.set(true);

    try {
      const { data, error } = await this.supabase.rpc(name, args);

      if (error) {
        this.toast.error('The timer could not be updated. Try again.');

        return { ok: false, entry: null };
      }

      // A stop with nothing running returns an all-null row.
      const parsed = EntryRowSchema.safeParse(data);

      if (!parsed.success) return { ok: true, entry: null };
      this.learnServerOffset(parsed.data);

      return { ok: true, entry: mapEntryRow(parsed.data) };
    } finally {
      this.busyState.set(false);
    }
  }

  private async loadRunning(): Promise<void> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from('task_time_entries')
      .select(ENTRY_COLUMNS)
      .is('ended_at', null)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[TimeTracking] Unable to load the running timer.', error);

      return;
    }

    const parsed = data ? EntryRowSchema.safeParse(data) : null;

    this.runningState.set(parsed?.success ? mapEntryRow(parsed.data) : null);
    this.nowMs.set(Date.now());
  }

  private async loadAccount(): Promise<void> {
    const user = this.session.user();

    if (!this.supabase || !user) return;

    const { data, error } = await this.supabase
      .from('app_users')
      .select('focus_limit_minutes, timezone')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('[TimeTracking] Unable to load account settings.', error);

      return;
    }

    const parsed = AccountRowSchema.safeParse(data);

    if (!parsed.success) return;
    const limit = parsed.data.focus_limit_minutes;

    this.limitState.set(limit !== null && isValidLimit(limit) ? limit : null);
    this.timezoneState.set(parsed.data.timezone || DEFAULT_ACCOUNT_TIMEZONE);
  }

  private learnServerOffset(row: EntryRow): void {
    if (!row.updated_at) return;
    const serverMs = Date.parse(row.updated_at);

    if (Number.isFinite(serverMs)) {
      this.serverOffsetMs = serverMs - Date.now();
      this.nowMs.set(Date.now());
    }
  }

  /** Runs inside a click so browsers allow sound and the permission prompt. */
  private prepareAlerts(): void {
    if (!this.isBrowser) return;

    try {
      this.audioContext ??= new AudioContext();
      void this.audioContext.resume();
    } catch {
      this.audioContext = null;
    }

    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission().catch(() => undefined);
    }
  }

  private announceLimit(entry: TimeEntry): void {
    if (!this.isBrowser) return;
    this.playChime();

    if ('Notification' in window && Notification.permission === 'granted') {
      const task = this.tasks.list().find((item) => item.id === entry.taskId);

      try {
        new Notification('Focus limit reached', {
          body: task ? task.name : 'Time for a break.',
          tag: `focus-limit-${entry.id}`,
        });
      } catch {
        // Some mobile browsers only allow notifications from a service worker.
      }
    }
  }

  private playChime(): void {
    const context = this.audioContext;

    if (!context) return;
    void context
      .resume()
      .then(() => {
        [880, 1320].forEach((frequency, index) => {
          const start = context.currentTime + index * 0.35;
          const oscillator = context.createOscillator();
          const gain = context.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
          oscillator.connect(gain).connect(context.destination);
          oscillator.start(start);
          oscillator.stop(start + 1.25);
        });
      })
      .catch(() => undefined);
  }

  private reset(): void {
    this.loadedUserId = null;
    this.runningState.set(null);
    this.limitState.set(FOCUS_LIMIT_DEFAULT_MINUTES);
    this.timezoneState.set(DEFAULT_ACCOUNT_TIMEZONE);
    this.alertedEntryId = null;
    this.serverOffsetMs = 0;
  }
}

export function elapsedSecondsAt(
  entry: TimeEntry,
  serverNowMs: number
): number {
  const startedMs = Date.parse(entry.startedAt);
  const endMs = entry.endedAt ? Date.parse(entry.endedAt) : serverNowMs;

  if (!Number.isFinite(startedMs) || !Number.isFinite(endMs)) return 0;

  return Math.min(
    MAX_ENTRY_SECONDS,
    Math.max(0, Math.floor((endMs - startedMs) / 1000))
  );
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0'
  )}`;

  return hours > 0 ? `${hours}:${mmss}` : mmss;
}

/** Human duration such as "1 h 25 min" or "40 min". */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(Math.max(0, totalSeconds) / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} min`;

  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

function isValidLimit(minutes: number): boolean {
  return (
    Number.isInteger(minutes) &&
    minutes >= FOCUS_LIMIT_MIN_MINUTES &&
    minutes <= FOCUS_LIMIT_MAX_MINUTES
  );
}

function entryErrorMessage(code: string | undefined): string {
  switch (code) {
    case '23P01':
      return 'This time overlaps another entry.';
    case '23514':
      return 'The end must be after the start, within 24 hours.';
    case '22023':
      return 'Time entries cannot be in the future.';
    default:
      return 'The time entry could not be saved.';
  }
}

function parseEntries(rows: unknown[]): TimeEntry[] {
  return rows.flatMap((row) => {
    const parsed = EntryRowSchema.safeParse(row);

    return parsed.success ? [mapEntryRow(parsed.data)] : [];
  });
}

function mapEntryRow(row: EntryRow): TimeEntry {
  return {
    id: row.id,
    taskId: row.task_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    limitMinutes: row.limit_minutes,
    source: row.source,
    note: row.note,
  };
}
