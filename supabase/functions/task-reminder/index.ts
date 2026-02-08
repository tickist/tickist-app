import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

interface ReminderPayload {
  taskId: string;
  event: "created" | "completed" | "snoozed";
  message?: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload: ReminderPayload = await req.json();
  if (!payload?.taskId || !payload?.event) {
    return new Response(JSON.stringify({ error: "Missing taskId or event" }), {
      status: 400,
    });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRole);
  const userJwt = req.headers.get("x-user-jwt");
  if (!userJwt) {
    return new Response(JSON.stringify({ error: "Missing x-user-jwt header" }), {
      status: 401,
    });
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(userJwt);
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid user session token" }), {
      status: 401,
    });
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .select(
      "id, name, owner_id, project_id, finish_date, task_type"
    )
    .eq("id", payload.taskId)
    .single();

  if (error || !task) {
    return new Response(
      JSON.stringify({ error: "Task not found", details: error }),
      { status: 404 }
    );
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
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
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
    return new Response(
      JSON.stringify({ error: "Failed to log notification" }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
