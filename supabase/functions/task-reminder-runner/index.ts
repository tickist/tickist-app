import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, type User } from "npm:@supabase/supabase-js@2";
import {
  getInternalFunctionSecret,
  isRecord,
  jsonResponse,
  requireEnv,
  requireInternalFunctionSecret,
  requireSupabaseSecretKey,
} from "../_shared/common.ts";

interface RunnerPayload {
  limit?: number;
}

interface TaskReminderRow {
  id: string;
  task_id: string;
  owner_id: string;
  channel: "email";
  remind_at: string;
  timezone: string;
  status: "scheduled" | "processing" | "sent" | "cancelled" | "failed" | "dead";
  attempt_count: number;
}

interface TaskRow {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  is_done: boolean;
  is_active: boolean;
  finish_date: string | null;
  finish_time: string | null;
}

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const MAX_ATTEMPTS = 10;

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const requestId = crypto.randomUUID();
  const providedSecret = getInternalFunctionSecret(req);
  const internalFunctionSecret = requireInternalFunctionSecret();
  if (!providedSecret || providedSecret !== internalFunctionSecret) {
    return jsonResponse(403, { error: "Forbidden", request_id: requestId });
  }

  let payload: RunnerPayload = {};
  if ((req.headers.get("content-length") ?? "0") !== "0") {
    try {
      const raw = await req.json();
      if (isRecord(raw)) {
        payload = raw as RunnerPayload;
      }
    } catch {
      return jsonResponse(400, { error: "Invalid JSON payload", request_id: requestId });
    }
  }

  const rawLimit = typeof payload.limit === "number"
    ? Math.floor(payload.limit)
    : DEFAULT_LIMIT;
  const limit = Math.max(1, Math.min(MAX_LIMIT, rawLimit || DEFAULT_LIMIT));

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const supabaseSecretKey = requireSupabaseSecretKey();
  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: claimedRows, error: claimError } = await supabase.rpc(
    "claim_due_task_reminders",
    { p_limit: limit },
  );
  if (claimError) {
    console.error("[task-reminder-runner] Failed to claim reminders", {
      requestId,
      code: claimError.code,
      message: claimError.message,
    });
    return jsonResponse(500, { error: "Failed to claim reminders", request_id: requestId });
  }

  const rows = (claimedRows ?? []) as TaskReminderRow[];
  const summary = {
    request_id: requestId,
    fetched: rows.length,
    enqueued: 0,
    cancelled: 0,
    retried: 0,
    dead: 0,
    skipped: 0,
  };

  for (const row of rows) {
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, owner_id, name, description, is_done, is_active, finish_date, finish_time")
      .eq("id", row.task_id)
      .maybeSingle();

    if (taskError) {
      await markReminderFailure(supabase, row, `task_lookup_failed:${taskError.message}`);
      summary.retried += 1;
      continue;
    }

    const taskRow = task as TaskRow | null;
    if (!taskRow || taskRow.is_done) {
      await cancelReminder(supabase, row.id, taskRow ? "Task completed" : "Task deleted");
      summary.cancelled += 1;
      continue;
    }

    const { data: authUser, error: authUserError } =
      await supabase.auth.admin.getUserById(row.owner_id);
    const user = authUser.user;
    const toEmail = user?.email?.trim().toLowerCase() ?? "";
    if (authUserError || !user || !toEmail) {
      await markReminderFailure(
        supabase,
        row,
        authUserError?.message ?? "missing_user_email",
      );
      summary.retried += 1;
      continue;
    }

    const emailPayload = buildEmailPayload(row, taskRow, user);
    const { error: enqueueError } = await supabase.rpc("enqueue_email", {
      p_to_email: toEmail,
      p_subject: emailPayload.subject,
      p_html: emailPayload.html,
      p_text: emailPayload.text,
      p_type: "task_reminder",
      p_dedupe_key: `task_reminder:${row.id}`,
    });

    if (enqueueError) {
      await markReminderFailure(supabase, row, enqueueError.message);
      summary.retried += 1;
      continue;
    }

    const { error: sentError } = await supabase
      .from("task_reminders")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", row.id)
      .eq("status", "processing");

    if (sentError) {
      console.error("[task-reminder-runner] Failed to mark reminder sent", {
        requestId,
        reminderId: row.id,
        code: sentError.code,
        message: sentError.message,
      });
      summary.skipped += 1;
      continue;
    }

    summary.enqueued += 1;
  }

  return jsonResponse(200, { ok: true, ...summary });
});

function buildEmailPayload(
  reminder: TaskReminderRow,
  task: TaskRow,
  user: User,
): { subject: string; html: string; text: string } {
  const taskName = task.name.trim();
  const displayName = getGreetingName(user);
  const dueLine = formatDueLine(task);
  const reminderLine = formatReminderLine(reminder);
  const description = task.description?.trim();
  const subject = `Tickist reminder: ${taskName}`;
  const text = [
    `Hi ${displayName},`,
    "",
    `This is your reminder for: ${taskName}`,
    reminderLine,
    dueLine,
    description ? `Description: ${description}` : null,
  ].filter((line): line is string => line !== null).join("\n");
  const html = [
    `<p>Hi ${escapeHtml(displayName)},</p>`,
    `<p>This is your reminder for:</p>`,
    `<h2>${escapeHtml(taskName)}</h2>`,
    `<p>${escapeHtml(reminderLine)}</p>`,
    dueLine ? `<p>${escapeHtml(dueLine)}</p>` : "",
    description ? `<p>${escapeHtml(description).replaceAll("\n", "<br>")}</p>` : "",
  ].join("\n");
  return { subject, html, text };
}

function getGreetingName(user: User): string {
  const metadataName =
    typeof user.user_metadata?.["name"] === "string"
      ? user.user_metadata["name"].trim()
      : "";
  if (metadataName) {
    return metadataName;
  }
  const emailName = user.email?.split("@")[0]?.trim();
  return emailName || "there";
}

function formatReminderLine(reminder: TaskReminderRow): string {
  const date = new Date(reminder.remind_at);
  if (Number.isNaN(date.getTime())) {
    return "Reminder time: now";
  }
  return `Reminder time: ${date.toLocaleString("en-US", {
    timeZone: normalizeTimezone(reminder.timezone),
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
}

function formatDueLine(task: TaskRow): string | null {
  if (!task.finish_date) {
    return null;
  }
  const time = task.finish_time ? ` ${task.finish_time.slice(0, 5)}` : "";
  return `Task due date: ${task.finish_date.slice(0, 10)}${time}`;
}

function normalizeTimezone(value: string): string {
  try {
    return Intl.DateTimeFormat(undefined, { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function cancelReminder(
  supabase: ReturnType<typeof createClient>,
  reminderId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase
    .from("task_reminders")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      last_error: reason,
    })
    .eq("id", reminderId)
    .eq("status", "processing");
  if (error) {
    console.error("[task-reminder-runner] Failed to cancel reminder", {
      reminderId,
      code: error.code,
      message: error.message,
    });
  }
}

async function markReminderFailure(
  supabase: ReturnType<typeof createClient>,
  reminder: TaskReminderRow,
  reason: string,
): Promise<void> {
  const nextAttempt = reminder.attempt_count + 1;
  const status = nextAttempt >= MAX_ATTEMPTS ? "dead" : "failed";
  const { error } = await supabase
    .from("task_reminders")
    .update({
      status,
      attempt_count: nextAttempt,
      last_error: truncate(reason),
    })
    .eq("id", reminder.id)
    .eq("status", "processing");
  if (error) {
    console.error("[task-reminder-runner] Failed to mark reminder failure", {
      reminderId: reminder.id,
      code: error.code,
      message: error.message,
    });
  }
}

function truncate(value: string, maxLength = 1000): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}
