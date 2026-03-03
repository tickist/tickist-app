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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRole);

  const { data, error } = await supabase
    .from("routine_reminders")
    .select("id, owner_id, project_id, task_id, cron, timezone");

  if (error || !data) {
    return jsonResponse(500, { error });
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
      return jsonResponse(500, { error: insertError });
    }
  }

  return jsonResponse(200, { processed: notifications.length });
});
