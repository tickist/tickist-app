import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

interface ProjectEventPayload {
  projectId: string;
  recipients: string[];
  title: string;
  description: string;
  event: "shared" | "removed" | "deleted";
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

  let payload: ProjectEventPayload;
  try {
    payload = (await req.json()) as ProjectEventPayload;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload" });
  }

  if (!payload.projectId || !payload.recipients?.length) {
    return jsonResponse(400, { error: "Missing projectId or recipients" });
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

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", payload.projectId)
    .maybeSingle();
  if (projectError || !project) {
    return jsonResponse(404, { error: "Project not found" });
  }
  if (project.owner_id !== user.id) {
    return jsonResponse(403, { error: "Forbidden" });
  }

  const inserts = payload.recipients.map((recipientId) => ({
    recipient_id: recipientId,
    title: payload.title,
    description: payload.description,
    type: `project-${payload.event}`,
  }));

  const { error } = await supabase.from("notifications").insert(inserts);
  if (error) {
    return jsonResponse(500, { error });
  }

  return jsonResponse(200, { ok: true });
});
