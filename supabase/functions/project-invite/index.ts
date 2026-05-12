import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, type User } from "npm:@supabase/supabase-js@2";
import {
  asOptionalString,
  getBearerToken,
  requireEnv,
  requireSupabaseSecretKey,
  toSha256Hex,
} from "../_shared/common.ts";

interface ProjectInvitePayload {
  projectId: string;
  email: string;
}

interface ProjectRow {
  id: string;
  owner_id: string;
  name: string;
}

interface MemberRow {
  status: "pending" | "accepted" | "declined";
}

const MAX_EMAIL_LENGTH = 254;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  let payload: ProjectInvitePayload;
  try {
    payload = (await req.json()) as ProjectInvitePayload;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload", request_id: requestId });
  }

  const projectId = asOptionalString(payload.projectId);
  const email = asOptionalString(payload.email)?.toLowerCase() ?? null;
  if (!projectId || !email || email.length > MAX_EMAIL_LENGTH) {
    return jsonResponse(400, { error: "Invalid projectId or email", request_id: requestId });
  }

  const userToken = getBearerToken(req);
  if (!userToken) {
    return jsonResponse(401, { error: "Missing Authorization Bearer token", request_id: requestId });
  }

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRole = requireSupabaseSecretKey();
  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user: actor },
    error: actorError,
  } = await supabase.auth.getUser(userToken);
  if (actorError || !actor) {
    return jsonResponse(401, { error: "Invalid user token", request_id: requestId });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, owner_id, name")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError || !project) {
    return jsonResponse(404, { error: "Project not found", request_id: requestId });
  }

  const typedProject = project as ProjectRow;
  if (typedProject.owner_id !== actor.id) {
    return jsonResponse(403, { error: "Forbidden", request_id: requestId });
  }

  let invitedUser: User | null;
  try {
    invitedUser = await findUserByEmail(supabase, email);
  } catch (error) {
    console.error("[project-invite] Failed to resolve invited user", {
      requestId,
      error,
    });
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
  }
  if (!invitedUser) {
    return jsonResponse(200, {
      ok: false,
      code: "user_not_found",
      message: "This person needs to create a Tickist account first.",
      request_id: requestId,
    });
  }

  if (invitedUser.id === actor.id) {
    return jsonResponse(400, {
      error: "You cannot invite yourself",
      code: "self_invite",
      request_id: requestId,
    });
  }

  const { data: existing, error: existingError } = await supabase
    .from("project_members")
    .select("status")
    .eq("project_id", typedProject.id)
    .eq("user_id", invitedUser.id)
    .maybeSingle();
  if (existingError) {
    console.error("[project-invite] Failed to inspect existing member", {
      requestId,
      error: existingError,
    });
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
  }

  const existingStatus = (existing as MemberRow | null)?.status ?? null;
  if (existingStatus === "accepted") {
    return jsonResponse(200, {
      ok: true,
      code: "already_member",
      member: { userId: invitedUser.id, email, status: "accepted" },
      request_id: requestId,
    });
  }

  const { error: upsertError } = await supabase.from("project_members").upsert(
    {
      project_id: typedProject.id,
      user_id: invitedUser.id,
      role: "editor",
      invited_via: "email",
      invited_by: actor.id,
      invited_email: email,
      invited_project_name: typedProject.name,
      invited_at: new Date().toISOString(),
      status: "pending",
      accepted_at: null,
      declined_at: null,
    },
    { onConflict: "project_id,user_id" },
  );
  if (upsertError) {
    console.error("[project-invite] Failed to upsert member invite", {
      requestId,
      error: upsertError,
    });
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
  }

  const title = "Shared list invitation";
  const description = `You were invited to share "${typedProject.name}".`;
  await supabase.from("notifications").insert({
    recipient_id: invitedUser.id,
    title,
    description,
    type: "project-invite",
    icon: "team",
  });

  const dedupeDigest = await toSha256Hex(`${typedProject.id}:${invitedUser.id}:project-invite`);
  const { error: emailError } = await supabase.rpc("enqueue_email", {
    p_to_email: email,
    p_subject: `Tickist invitation: ${typedProject.name}`,
    p_html:
      `<p>You were invited to share <strong>${escapeHtml(typedProject.name)}</strong> in Tickist.</p>` +
      "<p>Open Tickist and go to Team to accept or decline this invitation.</p>",
    p_text:
      `You were invited to share "${typedProject.name}" in Tickist.\n\n` +
      "Open Tickist and go to Team to accept or decline this invitation.",
    p_type: "project-invite",
    p_dedupe_key: `project-invite:${typedProject.id}:${invitedUser.id}:${dedupeDigest}`,
  });
  if (emailError) {
    console.error("[project-invite] Failed to queue invite email", {
      requestId,
      error: emailError,
    });
  }

  return jsonResponse(200, {
    ok: true,
    code: existingStatus === "pending" ? "already_pending" : "invited",
    member: { userId: invitedUser.id, email, status: "pending" },
    request_id: requestId,
  });
});

async function findUserByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string,
): Promise<User | null> {
  let page = 1;
  const perPage = 1000;
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw error;
    }
    const match =
      data.users.find((user) => user.email?.trim().toLowerCase() === email) ??
      null;
    if (match || data.users.length < perPage) {
      return match;
    }
    page += 1;
  }
  return null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
