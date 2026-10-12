import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  asOptionalString,
  getBearerToken,
  requireEnv,
  requireSupabaseSecretKey,
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
  invited_at: string | null;
  declined_at: string | null;
}

const MAX_EMAIL_LENGTH = 254;
const MAX_PROJECT_NAME_IN_MESSAGE = 120;
const ACTOR_INVITES_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;
const INVITEE_COOLDOWN_MS = 24 * HOUR_MS;
const PENDING_INVITE_LIFETIME_MS = 30 * 24 * HOUR_MS;
const INVITE_EMAIL_SUBJECT = "You have been invited to a shared Tickist project";

// Unknown addresses and new invitations share this response so the endpoint
// does not reveal whether an email address belongs to a Tickist account.
const inviteProcessedResponse = (requestId: string) =>
  jsonResponse(200, {
    ok: true,
    code: "invite_processed",
    request_id: requestId,
  });

const rateLimitedResponse = (requestId: string) =>
  jsonResponse(429, {
    error: "Too many invitations",
    code: "rate_limited",
    message: "Too many invitations. Try again later.",
    request_id: requestId,
  });

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

  const actorEmail = actor.email?.trim().toLowerCase() ?? null;
  if (actorEmail && actorEmail === email) {
    return jsonResponse(400, {
      error: "You cannot invite yourself",
      code: "self_invite",
      request_id: requestId,
    });
  }

  // Applied before the account lookup so the limit behaves the same for known
  // and unknown addresses.
  const { count: recentInviteCount, error: rateError } = await supabase
    .from("project_members")
    .select("project_id, projects!inner(owner_id)", {
      count: "exact",
      head: true,
    })
    .eq("projects.owner_id", actor.id)
    .gt("invited_at", new Date(Date.now() - HOUR_MS).toISOString());
  if (rateError) {
    console.error("[project-invite] Failed to check invitation rate", {
      requestId,
      error: rateError,
    });
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
  }
  if ((recentInviteCount ?? 0) >= ACTOR_INVITES_PER_HOUR) {
    return rateLimitedResponse(requestId);
  }

  const { data: invitedUserId, error: lookupError } = await supabase.rpc(
    "find_auth_user_id_by_email",
    { p_email: email },
  );
  if (lookupError) {
    console.error("[project-invite] Failed to resolve invited user", {
      requestId,
      error: lookupError,
    });
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
  }
  if (typeof invitedUserId !== "string" || !invitedUserId) {
    return inviteProcessedResponse(requestId);
  }

  if (invitedUserId === actor.id) {
    return jsonResponse(400, {
      error: "You cannot invite yourself",
      code: "self_invite",
      request_id: requestId,
    });
  }

  const { data: existing, error: existingError } = await supabase
    .from("project_members")
    .select("status, invited_at, declined_at")
    .eq("project_id", typedProject.id)
    .eq("user_id", invitedUserId)
    .maybeSingle();
  if (existingError) {
    console.error("[project-invite] Failed to inspect existing member", {
      requestId,
      error: existingError,
    });
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
  }

  // The owner can already see accepted and pending members of their project,
  // so these results do not disclose anything beyond the member list.
  const existingMember = existing as MemberRow | null;
  if (existingMember?.status === "accepted") {
    return jsonResponse(200, {
      ok: true,
      code: "already_member",
      request_id: requestId,
    });
  }

  const now = Date.now();
  if (
    existingMember?.status === "pending" &&
    isWithin(existingMember.invited_at, PENDING_INVITE_LIFETIME_MS, now)
  ) {
    return jsonResponse(200, {
      ok: true,
      code: "already_pending",
      request_id: requestId,
    });
  }

  if (
    existingMember &&
    (isWithin(existingMember.invited_at, INVITEE_COOLDOWN_MS, now) ||
      isWithin(existingMember.declined_at, INVITEE_COOLDOWN_MS, now))
  ) {
    return rateLimitedResponse(requestId);
  }

  const { data: invitation, error: upsertError } = await supabase.from("project_members").upsert(
    {
      project_id: typedProject.id,
      user_id: invitedUserId,
      role: "editor",
      invited_via: "email",
      invited_by: actor.id,
      invited_email: email,
      invited_project_name: typedProject.name,
      invited_at: new Date(now).toISOString(),
      status: "pending",
      accepted_at: null,
      declined_at: null,
    },
    { onConflict: "project_id,user_id" },
  ).select("invitation_id").single();
  if (upsertError || !invitation) {
    console.error("[project-invite] Failed to upsert member invite", {
      requestId,
      error: upsertError,
    });
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
  }

  const projectName = truncate(typedProject.name, MAX_PROJECT_NAME_IN_MESSAGE);
  const title = "Shared list invitation";
  const description = `You were invited to share "${projectName}".`;
  await supabase.from("notifications").insert({
    recipient_id: invitedUserId,
    title,
    description,
    type: "project-invite",
    icon: "team",
  });

  const { error: emailError } = await supabase.rpc("enqueue_email", {
    p_to_email: email,
    p_subject: INVITE_EMAIL_SUBJECT,
    p_html:
      `<p>You were invited to share <strong>${escapeHtml(projectName)}</strong> in Tickist.</p>` +
      "<p>Open Tickist and go to Team to accept or decline this invitation.</p>",
    p_text:
      `You were invited to share "${projectName}" in Tickist.\n\n` +
      "Open Tickist and go to Team to accept or decline this invitation.",
    p_type: "project-invite",
    p_dedupe_key: `project-invite:${typedProject.id}:${invitedUserId}:${invitation.invitation_id}`,
  });
  if (emailError) {
    console.error("[project-invite] Failed to queue invite email", {
      requestId,
      error: emailError,
    });
  }

  return inviteProcessedResponse(requestId);
});

function isWithin(timestamp: string | null | undefined, windowMs: number, now: number): boolean {
  if (!timestamp) {
    return false;
  }
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) && parsed > now - windowMs;
}

function truncate(value: string, maxLength: number): string {
  const characters = Array.from(value);
  return characters.length > maxLength
    ? `${characters.slice(0, maxLength - 1).join("")}…`
    : value;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
