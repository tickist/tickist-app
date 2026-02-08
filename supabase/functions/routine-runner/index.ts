import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

interface RoutineReminderRow {
  id: string;
  owner_id: string;
  project_id: string | null;
  task_id: string | null;
  cron: string;
  timezone: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRole);

  const { data, error } = await supabase
    .from("routine_reminders")
    .select("id, owner_id, project_id, task_id, cron, timezone");

  if (error || !data) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  const notifications = data.map((reminder: RoutineReminderRow) => ({
    recipient_id: reminder.owner_id,
    title: "Routine reminder",
    description: `Routine ${reminder.id} should run (cron: ${reminder.cron}).`,
    type: "routine-reminder",
  }));

  if (notifications.length) {
    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);
    if (insertError) {
      return new Response(JSON.stringify({ error: insertError }), {
        status: 500,
      });
    }
  }

  return new Response(JSON.stringify({ processed: notifications.length }), {
    status: 200,
  });
});
