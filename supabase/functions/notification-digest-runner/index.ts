import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient, type User } from 'npm:@supabase/supabase-js@2';
import { jsonResponse, requireEnv } from '../_shared/common.ts';

type NotificationKey = 'weekly_summary' | 'daily_summary';
type ScheduleType = 'daily' | 'weekly';

interface NotificationPreferenceRow {
  id: string;
  user_id: string;
  notification_key: NotificationKey;
  channel: 'email';
  enabled: boolean;
  schedule_type: ScheduleType;
  day_of_week: number | null;
  time_of_day: string;
  timezone: string;
  last_sent_at: string | null;
}

interface DigestTaskRow {
  id: string;
  name: string;
  finish_date: string | null;
  when_complete: string | null;
  project: { name: string | null } | { name: string | null }[] | null;
}

interface DigestTaskItem {
  id: string;
  name: string;
  projectName: string | null;
  timestamp: string | null;
}

interface EmailPayload {
  subject: string;
  html: string;
  text: string;
  dedupeKey: string;
}

interface ZonedParts {
  dateKey: string;
  weekday: number;
  minutesOfDay: number;
}

type DateTimePartType =
  | 'year'
  | 'month'
  | 'day'
  | 'weekday'
  | 'hour'
  | 'minute';

const INTERNAL_SECRET_HEADER = 'x-internal-cron-secret';
const MAX_PREFERENCES_PER_RUN = 500;
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const requestId = crypto.randomUUID();
  const configuredSecret = Deno.env.get('ROUTINE_RUNNER_SECRET')?.trim() ?? '';
  const providedSecret = req.headers.get(INTERNAL_SECRET_HEADER)?.trim() ?? '';
  if (
    !configuredSecret ||
    !providedSecret ||
    providedSecret !== configuredSecret
  ) {
    return jsonResponse(403, { error: 'Forbidden', request_id: requestId });
  }

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from('notification_preferences')
    .select(
      'id, user_id, notification_key, channel, enabled, schedule_type, day_of_week, time_of_day, timezone, last_sent_at'
    )
    .eq('channel', 'email')
    .eq('enabled', true)
    .limit(MAX_PREFERENCES_PER_RUN);

  if (error || !data) {
    console.error('[notification-digest-runner] Failed to fetch preferences', {
      requestId,
      error,
    });
    return jsonResponse(500, {
      error: 'Internal server error',
      request_id: requestId,
    });
  }

  const now = new Date();
  let processed = 0;
  let enqueued = 0;
  let skipped = 0;

  for (const preference of data as NotificationPreferenceRow[]) {
    processed += 1;

    if (!isPreferenceDue(preference, now)) {
      skipped += 1;
      continue;
    }

    const { data: authUser, error: authUserError } =
      await supabase.auth.admin.getUserById(preference.user_id);
    if (authUserError || !authUser.user) {
      console.error(
        '[notification-digest-runner] Failed to resolve auth user',
        {
          requestId,
          preferenceId: preference.id,
          userId: preference.user_id,
          error: authUserError,
        }
      );
      skipped += 1;
      continue;
    }

    const recipientEmail = authUser.user.email?.trim().toLowerCase() ?? '';
    if (!recipientEmail) {
      skipped += 1;
      continue;
    }

    const payload = await buildEmailPayload(
      supabase,
      preference,
      authUser.user,
      now
    );
    if (!payload) {
      skipped += 1;
      continue;
    }

    const { error: enqueueError } = await supabase.rpc('enqueue_email', {
      p_to_email: recipientEmail,
      p_subject: payload.subject,
      p_html: payload.html,
      p_text: payload.text,
      p_type: preference.notification_key,
      p_dedupe_key: payload.dedupeKey,
    });

    if (enqueueError) {
      console.error('[notification-digest-runner] Failed to enqueue email', {
        requestId,
        preferenceId: preference.id,
        userId: preference.user_id,
        code: enqueueError.code,
        message: enqueueError.message,
      });
      skipped += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from('notification_preferences')
      .update({ last_sent_at: now.toISOString() })
      .eq('id', preference.id);

    if (updateError) {
      console.error(
        '[notification-digest-runner] Failed to update last_sent_at',
        {
          requestId,
          preferenceId: preference.id,
          error: updateError,
        }
      );
    }

    enqueued += 1;
  }

  return jsonResponse(200, {
    ok: true,
    request_id: requestId,
    processed,
    enqueued,
    skipped,
  });
});

async function buildEmailPayload(
  supabase: ReturnType<typeof createClient>,
  preference: NotificationPreferenceRow,
  user: User,
  now: Date
): Promise<EmailPayload | null> {
  const timezone = normalizeTimezone(preference.timezone);
  const greetingName = getGreetingName(user);
  const nowParts = getZonedParts(now, timezone);

  const completedRows = await fetchRecentCompletedTasks(
    supabase,
    preference.user_id
  );
  const upcomingRows = await fetchUpcomingTasks(supabase, preference.user_id);

  const completed = toDigestItems(completedRows, 'when_complete');
  const upcoming = toDigestItems(upcomingRows, 'finish_date');

  if (preference.notification_key === 'weekly_summary') {
    const completedRange = getCurrentWeekRange(nowParts.dateKey);
    const upcomingRange = getNextWeekRange(nowParts.dateKey);
    const completedTasks = filterByDateRange(
      completed,
      completedRange.startKey,
      completedRange.endKey,
      timezone
    );
    const upcomingTasks = filterByDateRange(
      upcoming,
      upcomingRange.startKey,
      upcomingRange.endKey,
      timezone
    );
    const periodLabel = `${completedRange.startKey} to ${completedRange.endKey}`;
    const dedupeKey = `weekly_summary:${preference.user_id}:${nowParts.dateKey}`;
    return buildWeeklyEmail(
      greetingName,
      timezone,
      completedTasks,
      upcomingTasks,
      periodLabel,
      dedupeKey
    );
  }

  const todayKey = nowParts.dateKey;
  const tomorrowKey = addDaysToDateKey(todayKey, 1);
  const completedTasks = filterByExactDate(completed, todayKey, timezone);
  const upcomingTasks = filterByExactDate(upcoming, tomorrowKey, timezone);
  const dedupeKey = `daily_summary:${preference.user_id}:${todayKey}`;
  return buildDailyEmail(
    greetingName,
    timezone,
    completedTasks,
    upcomingTasks,
    todayKey,
    tomorrowKey,
    dedupeKey
  );
}

async function fetchRecentCompletedTasks(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<DigestTaskRow[]> {
  const lowerBound = new Date(
    Date.now() - 8 * 24 * 60 * 60 * 1000
  ).toISOString();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, name, when_complete, project:projects(name)')
    .eq('owner_id', userId)
    .eq('is_done', true)
    .not('when_complete', 'is', null)
    .gte('when_complete', lowerBound)
    .order('when_complete', { ascending: false })
    .limit(500);

  if (error || !data) {
    console.error(
      '[notification-digest-runner] Failed to fetch completed tasks',
      {
        userId,
        error,
      }
    );
    return [];
  }

  return data as DigestTaskRow[];
}

async function fetchUpcomingTasks(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<DigestTaskRow[]> {
  const lowerBound = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const upperBound = new Date(
    Date.now() + 8 * 24 * 60 * 60 * 1000
  ).toISOString();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, name, finish_date, project:projects(name)')
    .eq('owner_id', userId)
    .eq('is_done', false)
    .eq('is_active', true)
    .not('finish_date', 'is', null)
    .gte('finish_date', lowerBound)
    .lte('finish_date', upperBound)
    .order('finish_date', { ascending: true })
    .limit(500);

  if (error || !data) {
    console.error(
      '[notification-digest-runner] Failed to fetch upcoming tasks',
      {
        userId,
        error,
      }
    );
    return [];
  }

  return data as DigestTaskRow[];
}

function isPreferenceDue(
  preference: NotificationPreferenceRow,
  now: Date
): boolean {
  if (!preference.enabled || preference.channel !== 'email') {
    return false;
  }

  const timezone = normalizeTimezone(preference.timezone);
  const scheduledMinutes = parseTimeOfDay(preference.time_of_day);
  if (scheduledMinutes === null) {
    return false;
  }

  const current = getZonedParts(now, timezone);
  if (current.minutesOfDay < scheduledMinutes) {
    return false;
  }

  if (preference.last_sent_at) {
    const lastSent = getZonedParts(new Date(preference.last_sent_at), timezone);
    if (lastSent.dateKey === current.dateKey) {
      return false;
    }
  }

  if (preference.schedule_type === 'weekly') {
    return preference.day_of_week === current.weekday;
  }

  return true;
}

function buildWeeklyEmail(
  greetingName: string,
  timezone: string,
  completedTasks: DigestTaskItem[],
  upcomingTasks: DigestTaskItem[],
  periodLabel: string,
  dedupeKey: string
): EmailPayload {
  const subject = 'Your Tickist weekly summary';
  const completedListHtml = buildTaskListHtml(
    completedTasks,
    timezone,
    'completed'
  );
  const upcomingListHtml = buildTaskListHtml(
    upcomingTasks,
    timezone,
    'scheduled'
  );
  const completedListText = buildTaskListText(
    completedTasks,
    timezone,
    'completed'
  );
  const upcomingListText = buildTaskListText(
    upcomingTasks,
    timezone,
    'scheduled'
  );
  const completedHeading =
    completedTasks.length > 0
      ? `You completed ${completedTasks.length} task${
          completedTasks.length === 1 ? '' : 's'
        } this week.`
      : 'No completed tasks were recorded this week, but a fresh week starts now.';

  const html = [
    `<h1>Weekly summary</h1>`,
    `<p>Hi ${escapeHtml(greetingName)},</p>`,
    `<p>${escapeHtml(completedHeading)}</p>`,
    `<p><strong>Completed this week</strong><br>${escapeHtml(periodLabel)}</p>`,
    completedListHtml,
    `<p><strong>Coming up next week</strong></p>`,
    upcomingListHtml,
  ].join('');

  const text = [
    `Weekly summary`,
    ``,
    `Hi ${greetingName},`,
    completedHeading,
    `Completed this week (${periodLabel}):`,
    completedListText,
    ``,
    `Coming up next week:`,
    upcomingListText,
  ].join('\n');

  return { subject, html, text, dedupeKey };
}

function buildDailyEmail(
  greetingName: string,
  timezone: string,
  completedTasks: DigestTaskItem[],
  upcomingTasks: DigestTaskItem[],
  todayKey: string,
  tomorrowKey: string,
  dedupeKey: string
): EmailPayload {
  const subject = 'Your Tickist daily summary';
  const completedListHtml = buildTaskListHtml(
    completedTasks,
    timezone,
    'completed'
  );
  const upcomingListHtml = buildTaskListHtml(
    upcomingTasks,
    timezone,
    'scheduled'
  );
  const completedListText = buildTaskListText(
    completedTasks,
    timezone,
    'completed'
  );
  const upcomingListText = buildTaskListText(
    upcomingTasks,
    timezone,
    'scheduled'
  );
  const summary =
    completedTasks.length > 0
      ? `Nice work. You closed ${completedTasks.length} task${
          completedTasks.length === 1 ? '' : 's'
        } today.`
      : 'No tasks were completed today yet.';

  const html = [
    `<h1>Daily summary</h1>`,
    `<p>Hi ${escapeHtml(greetingName)},</p>`,
    `<p>${escapeHtml(summary)}</p>`,
    `<p><strong>Completed today</strong><br>${escapeHtml(todayKey)}</p>`,
    completedListHtml,
    `<p><strong>Scheduled for tomorrow</strong><br>${escapeHtml(
      tomorrowKey
    )}</p>`,
    upcomingListHtml,
  ].join('');

  const text = [
    `Daily summary`,
    ``,
    `Hi ${greetingName},`,
    summary,
    `Completed today (${todayKey}):`,
    completedListText,
    ``,
    `Scheduled for tomorrow (${tomorrowKey}):`,
    upcomingListText,
  ].join('\n');

  return { subject, html, text, dedupeKey };
}

function buildTaskListHtml(
  items: DigestTaskItem[],
  timezone: string,
  verb: 'completed' | 'scheduled'
): string {
  if (items.length === 0) {
    return `<p>No tasks ${verb}.</p>`;
  }

  const listItems = items
    .map((item) => {
      const projectPart = item.projectName
        ? ` <em>(${escapeHtml(item.projectName)})</em>`
        : '';
      const timestampPart = item.timestamp
        ? ` <span>${escapeHtml(
            formatTimestamp(item.timestamp, timezone)
          )}</span>`
        : '';
      return `<li><strong>${escapeHtml(
        item.name
      )}</strong>${projectPart}${timestampPart}</li>`;
    })
    .join('');

  return `<ul>${listItems}</ul>`;
}

function buildTaskListText(
  items: DigestTaskItem[],
  timezone: string,
  verb: 'completed' | 'scheduled'
): string {
  if (items.length === 0) {
    return `- No tasks ${verb}.`;
  }

  return items
    .map((item) => {
      const projectPart = item.projectName ? ` (${item.projectName})` : '';
      const timestampPart = item.timestamp
        ? ` - ${formatTimestamp(item.timestamp, timezone)}`
        : '';
      return `- ${item.name}${projectPart}${timestampPart}`;
    })
    .join('\n');
}

function toDigestItems(
  rows: DigestTaskRow[],
  timestampField: 'when_complete' | 'finish_date'
): DigestTaskItem[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    projectName: getProjectName(row.project),
    timestamp: row[timestampField] ?? null,
  }));
}

function filterByExactDate(
  items: DigestTaskItem[],
  expectedDateKey: string,
  timezone: string
): DigestTaskItem[] {
  return items.filter((item) => {
    if (!item.timestamp) {
      return false;
    }
    return (
      getZonedParts(new Date(item.timestamp), timezone).dateKey ===
      expectedDateKey
    );
  });
}

function filterByDateRange(
  items: DigestTaskItem[],
  startKey: string,
  endKey: string,
  timezone: string
): DigestTaskItem[] {
  return items.filter((item) => {
    if (!item.timestamp) {
      return false;
    }
    const dateKey = getZonedParts(new Date(item.timestamp), timezone).dateKey;
    return dateKey >= startKey && dateKey <= endKey;
  });
}

function getCurrentWeekRange(todayKey: string): {
  startKey: string;
  endKey: string;
} {
  const weekday = weekdayFromDateKey(todayKey);
  const shiftToMonday = weekday === 0 ? -6 : 1 - weekday;
  const startKey = addDaysToDateKey(todayKey, shiftToMonday);
  return { startKey, endKey: todayKey };
}

function getNextWeekRange(todayKey: string): {
  startKey: string;
  endKey: string;
} {
  const currentWeek = getCurrentWeekRange(todayKey);
  const startKey = addDaysToDateKey(currentWeek.startKey, 7);
  const endKey = addDaysToDateKey(startKey, 6);
  return { startKey, endKey };
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const baseDate = new Date(`${dateKey}T00:00:00Z`);
  baseDate.setUTCDate(baseDate.getUTCDate() + days);
  return [
    baseDate.getUTCFullYear().toString().padStart(4, '0'),
    (baseDate.getUTCMonth() + 1).toString().padStart(2, '0'),
    baseDate.getUTCDate().toString().padStart(2, '0'),
  ].join('-');
}

function weekdayFromDateKey(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00Z`).getUTCDay();
}

function getGreetingName(user: User): string {
  const metadata = user.user_metadata;
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const fullName = metadata['full_name'];
    if (typeof fullName === 'string' && fullName.trim().length > 0) {
      return fullName.trim();
    }
  }
  if (user.email && user.email.includes('@')) {
    return user.email.split('@', 1)[0];
  }
  return 'there';
}

function getProjectName(value: DigestTaskRow['project']): string | null {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first?.name === 'string' && first.name.trim().length > 0
      ? first.name.trim()
      : null;
  }
  if (value && typeof value.name === 'string' && value.name.trim().length > 0) {
    return value.name.trim();
  }
  return null;
}

function normalizeTimezone(value: string): string {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return value;
  } catch {
    return 'UTC';
  }
}

function parseTimeOfDay(value: string): number | null {
  const match = value.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) {
    return null;
  }
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

function getZonedParts(date: Date, timezone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);
  const year = getPart(parts, 'year');
  const month = getPart(parts, 'month');
  const day = getPart(parts, 'day');
  const weekday = WEEKDAY_INDEX[getPart(parts, 'weekday')] ?? 0;
  const hour = Number.parseInt(getPart(parts, 'hour'), 10);
  const minute = Number.parseInt(getPart(parts, 'minute'), 10);

  return {
    dateKey: `${year}-${month}-${day}`,
    weekday,
    minutesOfDay: hour * 60 + minute,
  };
}

function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: DateTimePartType
): string {
  const match = parts.find((part) => part.type === type)?.value;
  if (!match) {
    throw new Error(`Missing formatted part: ${type}`);
  }
  return match;
}

function formatTimestamp(timestamp: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
