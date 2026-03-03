import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

interface ReminderPayload {
  taskId: string;
  event: "created" | "completed" | "snoozed";
  message?: string;
}

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

  let payload: ReminderPayload;
  try {
    payload = (await req.json()) as ReminderPayload;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload" });
  }

  if (!payload?.taskId || !payload?.event) {
    return jsonResponse(400, { error: "Missing taskId or event" });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRole);
  const userJwt = req.headers.get("x-user-jwt");
  if (!userJwt) {
    return jsonResponse(401, { error: "Missing x-user-jwt header" });
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(userJwt);
  if (userError || !user) {
    return jsonResponse(401, { error: "Invalid user session token" });
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .select(
      "id, name, owner_id, project_id, finish_date, task_type"
    )
    .eq("id", payload.taskId)
    .single();

  if (error || !task) {
    return jsonResponse(404, { error: "Task not found", details: error });
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
    return jsonResponse(403, { error: "Forbidden" });
  }

  const message =
    payload.message ??
    (payload.event === "completed"
      ? `Task "${task.name}" was completed`
      : `Update on task "${task.name}".`);

  const { error: insertError } = await supabase.from("notifications").insert({
    recipient_id: task.owner_id,
    title: `Task ${payload.event}`,
    description: message,
    type: "task-event",
  });

  if (insertError) {
    return jsonResponse(500, { error: "Failed to log notification" });
  }

  return jsonResponse(200, { ok: true });
});
