import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireEnv, requireSupabaseSecretKey } from "../_shared/common.ts";

interface ProjectEventPayload {
  projectId: string;
  recipients: string[];
  title: string;
  description: string;
  event: "shared" | "removed";
}

interface ProjectMemberRow {
  user_id: string;
}

const MAX_RECIPIENTS = 100;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;

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
  let payload: ProjectEventPayload;
  try {
    payload = (await req.json()) as ProjectEventPayload;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload" });
  }

  const projectId = payload.projectId?.trim() ?? "";
  const event = payload.event;
  const title = payload.title?.trim() ?? "";
  const description = payload.description?.trim() ?? "";
  const recipients = Array.isArray(payload.recipients)
    ? Array.from(new Set(payload.recipients.map((id) => id.trim()).filter(Boolean)))
    : [];

  if (!projectId || recipients.length === 0) {
    return jsonResponse(400, { error: "Missing projectId or recipients", request_id: requestId });
  }
  if (!["shared", "removed"].includes(event)) {
    return jsonResponse(400, { error: "Invalid event", request_id: requestId });
  }
  if (!title || title.length > MAX_TITLE_LENGTH) {
    return jsonResponse(400, { error: "Invalid title length", request_id: requestId });
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return jsonResponse(400, { error: "Invalid description length", request_id: requestId });
  }
  if (recipients.length > MAX_RECIPIENTS) {
    return jsonResponse(400, { error: "Too many recipients", request_id: requestId });
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

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError || !project) {
    return jsonResponse(404, { error: "Project not found", request_id: requestId });
  }
  if (project.owner_id !== user.id) {
    return jsonResponse(403, { error: "Forbidden", request_id: requestId });
  }

  const { data: memberRows, error: membersError } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId)
    .in("user_id", recipients);
  if (membersError) {
    console.error("[project-update] Failed to validate members", {
      requestId,
      error: membersError,
    });
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
  }
  const memberIds = new Set((memberRows as ProjectMemberRow[] | null)?.map((row) => row.user_id));
  const invalidRecipients = recipients.filter((recipientId) => !memberIds.has(recipientId));
  if (invalidRecipients.length) {
    return jsonResponse(403, {
      error: "Recipients must belong to project members",
      request_id: requestId,
    });
  }

  const inserts = recipients.map((recipientId) => ({
    recipient_id: recipientId,
    title,
    description,
    type: `project-${event}`,
  }));

  const { error } = await supabase.from("notifications").insert(inserts);
  if (error) {
    console.error("[project-update] Failed to insert notifications", {
      requestId,
      error,
    });
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
  }

  return jsonResponse(200, { ok: true, inserted: inserts.length });
});
