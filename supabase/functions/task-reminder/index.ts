import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireEnv, requireSupabaseSecretKey } from "../_shared/common.ts";

interface ReminderPayload {
  taskId: string;
  event: "created" | "completed" | "snoozed";
  message?: string;
}

const MAX_MESSAGE_LENGTH = 1000;
const DEDUPE_WINDOW_SECONDS = 60;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-user-jwt",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const requestId = crypto.randomUUID();
  let payload: ReminderPayload;
  try {
    payload = (await req.json()) as ReminderPayload;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload" });
  }

  const taskId = payload.taskId?.trim() ?? "";
  const event = payload.event;
  const messageInput = payload.message?.trim();
  if (!taskId || !event) {
    return jsonResponse(400, { error: "Missing taskId or event", request_id: requestId });
  }
  if (!["created", "completed", "snoozed"].includes(event)) {
    return jsonResponse(400, { error: "Invalid event", request_id: requestId });
  }
  if (messageInput && messageInput.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse(400, { error: "Message too long", request_id: requestId });
  }
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRole = requireSupabaseSecretKey();

  const supabase = createClient(supabaseUrl, serviceRole);
  const userJwt = req.headers.get("x-user-jwt");
  if (!userJwt) {
    return jsonResponse(401, { error: "Missing x-user-jwt header", request_id: requestId });
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(userJwt);
  if (userError || !user) {
    return jsonResponse(401, { error: "Invalid user session token", request_id: requestId });
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .select("id, name, owner_id, project_id, finish_date, task_type")
    .eq("id", taskId)
    .single();

  if (error || !task) {
    return jsonResponse(404, { error: "Task not found", request_id: requestId });
  }

  let isActorAllowed = task.owner_id === user.id;
  if (!isActorAllowed && task.project_id) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", task.project_id)
      .eq("user_id", user.id)
      .maybeSingle();
    isActorAllowed = Boolean(membership);
  }
  if (!isActorAllowed) {
    return jsonResponse(403, { error: "Forbidden", request_id: requestId });
  }

  const message =
    messageInput ??
    (event === "completed"
      ? `Task "${task.name}" was completed`
      : `Update on task "${task.name}".`);
  const title = `Task ${event}`;
  const duplicateSince = new Date(
    Date.now() - DEDUPE_WINDOW_SECONDS * 1000
  ).toISOString();
  const { data: duplicateRows, error: duplicateError } = await supabase
    .from("notifications")
    .select("id")
    .eq("recipient_id", task.owner_id)
    .eq("type", "task-event")
    .eq("title", title)
    .eq("description", message)
    .gte("created_at", duplicateSince)
    .limit(1);
  if (duplicateError) {
    console.error("[task-reminder] Failed dedupe lookup", {
      requestId,
      error: duplicateError,
    });
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
  }
  if (duplicateRows && duplicateRows.length > 0) {
    return jsonResponse(200, { ok: true, deduplicated: true });
  }

  const { error: insertError } = await supabase.from("notifications").insert({
    recipient_id: task.owner_id,
    title,
    description: message,
    type: "task-event",
  });

  if (insertError) {
    console.error("[task-reminder] Failed to insert notification", {
      requestId,
      error: insertError,
    });
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
  }

  return jsonResponse(200, { ok: true, deduplicated: false });
});
