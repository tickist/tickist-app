import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

interface ProjectEventPayload {
  projectId: string;
  recipients: string[];
  title: string;
  description: string;
  event: "shared" | "removed" | "deleted";
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload: ProjectEventPayload = await req.json();
  if (!payload.projectId || !payload.recipients?.length) {
    return new Response("Missing projectId or recipients", { status: 400 });
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

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", payload.projectId)
    .maybeSingle();
  if (projectError || !project) {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
    });
  }
  if (project.owner_id !== user.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const inserts = payload.recipients.map((recipientId) => ({
    recipient_id: recipientId,
    title: payload.title,
    description: payload.description,
    type: `project-${payload.event}`,
  }));

  const { error } = await supabase.from("notifications").insert(inserts);
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
