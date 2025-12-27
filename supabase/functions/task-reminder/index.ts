import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

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
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRole);

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
