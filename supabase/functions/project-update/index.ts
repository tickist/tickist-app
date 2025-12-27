import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

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
