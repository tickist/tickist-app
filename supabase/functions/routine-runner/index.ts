import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  requireEnv,
  getInternalFunctionSecret,
  requireInternalFunctionSecret,
  requireSupabaseSecretKey,
} from "../_shared/common.ts";

interface RoutineReminderRow {
  id: string;
  owner_id: string;
  project_id: string | null;
  task_id: string | null;
  cron: string;
  timezone: string;
}

const MAX_REMINDERS_PER_RUN = 500;

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const requestId = crypto.randomUUID();
  const configuredSecret = requireInternalFunctionSecret();
  const providedSecret = getInternalFunctionSecret(req);
  if (!configuredSecret || !providedSecret || providedSecret !== configuredSecret) {
    return jsonResponse(403, { error: "Forbidden", request_id: requestId });
  }

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const supabaseSecretKey = requireSupabaseSecretKey();
  const supabase = createClient(supabaseUrl, supabaseSecretKey);

  const { data, error } = await supabase
    .from("routine_reminders")
    .select("id, owner_id, project_id, task_id, cron, timezone")
    .limit(MAX_REMINDERS_PER_RUN);

  if (error || !data) {
    console.error("[routine-runner] Failed to fetch reminders", { requestId, error });
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
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
      console.error("[routine-runner] Failed to insert notifications", {
        requestId,
        error: insertError,
      });
      return jsonResponse(500, { error: "Internal server error", request_id: requestId });
    }
  }

  return jsonResponse(200, { processed: notifications.length });
});
