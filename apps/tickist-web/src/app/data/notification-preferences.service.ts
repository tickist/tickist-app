import { Injectable, computed, inject, signal } from '@angular/core';
import { SUPABASE_CLIENT } from '../config/supabase.provider';

export type NotificationChannel = 'email';
export type NotificationKey = 'weekly_summary' | 'daily_summary';
export type NotificationScheduleType = 'daily' | 'weekly';

export interface NotificationPreference {
  key: NotificationKey;
  channel: NotificationChannel;
  enabled: boolean;
  scheduleType: NotificationScheduleType;
  dayOfWeek: number | null;
  timeOfDay: string;
  timezone: string;
}

type NotificationPreferenceRow = {
  notification_key: NotificationKey;
  channel: NotificationChannel;
  enabled: boolean;
  schedule_type: NotificationScheduleType;
  day_of_week: number | null;
  time_of_day: string;
  timezone: string;
};

const DEFAULT_TIME = '20:00';

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly items = signal<NotificationPreference[]>(
    buildDefaultPreferences()
  );
  private readonly loading = signal(false);

  readonly preferences = computed(() => this.items());
  readonly loadingState = computed(() => this.loading());

  async refresh(userId: string | null): Promise<void> {
    if (!this.supabase || !userId) {
      this.items.set(buildDefaultPreferences());
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const { data, error } = await this.supabase
      .from('notification_preferences')
      .select(
        'notification_key, channel, enabled, schedule_type, day_of_week, time_of_day, timezone'
      )
      .eq('user_id', userId);
    this.loading.set(false);

    if (error) {
      console.warn(
        '[NotificationPreferences] Unable to fetch preferences',
        error
      );
      this.items.set(buildDefaultPreferences());
      return;
    }

    this.items.set(
      mergeWithDefaults((data as NotificationPreferenceRow[] | null) ?? [])
    );
  }

  async save(
    userId: string,
    preferences: NotificationPreference[]
  ): Promise<void> {
    if (!this.supabase) {
      return;
    }

    const payload = preferences.map((preference) => ({
      user_id: userId,
      notification_key: preference.key,
      channel: preference.channel,
      enabled: preference.enabled,
      schedule_type: preference.scheduleType,
      day_of_week:
        preference.scheduleType === 'weekly' ? preference.dayOfWeek : null,
      time_of_day: normalizeTimeOfDay(preference.timeOfDay),
      timezone: normalizeTimezone(preference.timezone),
      config: {},
    }));

    const { error } = await this.supabase
      .from('notification_preferences')
      .upsert(payload, { onConflict: 'user_id,notification_key,channel' });

    if (error) {
      throw error;
    }

    this.items.set(
      mergeWithDefaults(
        payload.map((item) => ({
          notification_key: item.notification_key,
          channel: item.channel,
          enabled: item.enabled,
          schedule_type: item.schedule_type,
          day_of_week: item.day_of_week,
          time_of_day: item.time_of_day,
          timezone: item.timezone,
        }))
      )
    );
  }
}

function mergeWithDefaults(
  rows: NotificationPreferenceRow[]
): NotificationPreference[] {
  const defaults = buildDefaultPreferences();
  const rowMap = new Map(
    rows.map((row) => [`${row.notification_key}:${row.channel}`, row] as const)
  );

  return defaults.map((item) => {
    const row = rowMap.get(`${item.key}:${item.channel}`);
    if (!row) {
      return item;
    }

    return {
      key: row.notification_key,
      channel: row.channel,
      enabled: row.enabled,
      scheduleType: row.schedule_type,
      dayOfWeek: row.schedule_type === 'weekly' ? row.day_of_week : null,
      timeOfDay: normalizeTimeOfDay(row.time_of_day),
      timezone: normalizeTimezone(row.timezone),
    };
  });
}

function buildDefaultPreferences(): NotificationPreference[] {
  const timezone = resolveBrowserTimezone();
  return [
    {
      key: 'weekly_summary',
      channel: 'email',
      enabled: false,
      scheduleType: 'weekly',
      dayOfWeek: 0,
      timeOfDay: DEFAULT_TIME,
      timezone,
    },
    {
      key: 'daily_summary',
      channel: 'email',
      enabled: false,
      scheduleType: 'daily',
      dayOfWeek: null,
      timeOfDay: DEFAULT_TIME,
      timezone,
    },
  ];
}

function normalizeTimeOfDay(value: string): string {
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) {
    return DEFAULT_TIME;
  }
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return DEFAULT_TIME;
  }
  return `${match[1]}:${match[2]}`;
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
