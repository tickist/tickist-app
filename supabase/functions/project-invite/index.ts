import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  asOptionalString,
  cleanDisplayText,
  getBearerToken,
  isConnectedAppToken,
  requireEnv,
  requireSupabaseSecretKey,
} from "../_shared/common.ts";
import { APP_URL, emailButton } from "../_shared/email-layout.ts";

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

interface InvitationRow {
  invited_at: string;
}

const MAX_EMAIL_LENGTH = 254;
const MAX_PROJECT_NAME_IN_MESSAGE = 120;
const MAX_STORED_PROJECT_NAME = 200;
const ACTOR_INVITES_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;
const INVITEE_COOLDOWN_MS = 24 * HOUR_MS;
const PENDING_INVITE_LIFETIME_MS = 30 * 24 * HOUR_MS;
const INVITE_EMAIL_SUBJECT = "You have been invited to a shared Tickist project";

// Unknown addresses, new, pending, declined and recently sent invitations share
// this response, and the owner sees the same project_invitations record for
// each, so neither reveals whether an email address belongs to a Tickist
// account.
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

  // Connected apps cannot create relationships between accounts.
  if (isConnectedAppToken(userToken)) {
    return jsonResponse(403, {
      error: "Not available to connected apps",
      code: "connected_app",
      request_id: requestId,
    });
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
    .from("project_invitations")
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
  const knownUserId = typeof invitedUserId === "string" && invitedUserId
    ? invitedUserId
    : null;

  if (knownUserId === actor.id) {
    return jsonResponse(400, {
      error: "You cannot invite yourself",
      code: "self_invite",
      request_id: requestId,
    });
  }

  let existingMember: MemberRow | null = null;
  if (knownUserId) {
    const { data: existing, error: existingError } = await supabase
      .from("project_members")
      .select("status, invited_at, declined_at")
      .eq("project_id", typedProject.id)
      .eq("user_id", knownUserId)
      .maybeSingle();
    if (existingError) {
      console.error("[project-invite] Failed to inspect existing member", {
        requestId,
        error: existingError,
      });
      return jsonResponse(500, { error: "Internal server error", request_id: requestId });
    }
    existingMember = existing as MemberRow | null;
  }

  // The owner already sees accepted members, so this discloses nothing new.
  if (existingMember?.status === "accepted") {
    return jsonResponse(200, {
      ok: true,
      code: "already_member",
      request_id: requestId,
    });
  }

  const now = Date.now();
  const { data: record, error: recordError } = await supabase
    .from("project_invitations")
    .select("invited_at")
    .eq("project_id", typedProject.id)
    .eq("invited_email", email)
    .maybeSingle();
  if (recordError) {
    console.error("[project-invite] Failed to inspect invitation record", {
      requestId,
      error: recordError,
    });
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
  }

  // The owner-visible record depends only on its own age, never on whether
  // the address has an account.
  const invitationRecord = record as InvitationRow | null;
  if (!isWithin(invitationRecord?.invited_at, INVITEE_COOLDOWN_MS, now)) {
    const { error: recordUpsertError } = await supabase
      .from("project_invitations")
      .upsert(
        {
          project_id: typedProject.id,
          invited_email: email,
          invited_by: actor.id,
          invited_at: new Date(now).toISOString(),
        },
        { onConflict: "project_id,invited_email" },
      );
    if (recordUpsertError) {
      console.error("[project-invite] Failed to record invitation", {
        requestId,
        error: recordUpsertError,
      });
      return jsonResponse(500, { error: "Internal server error", request_id: requestId });
    }
  }

  if (!knownUserId) {
    return inviteProcessedResponse(requestId);
  }

  // A current invitation is not resent, and an address invited or declined
  // within the cooldown is not invited again; the owner gets the same answer.
  if (
    (existingMember?.status === "pending" &&
      isWithin(existingMember.invited_at, PENDING_INVITE_LIFETIME_MS, now)) ||
    (existingMember &&
      (isWithin(existingMember.invited_at, INVITEE_COOLDOWN_MS, now) ||
        isWithin(existingMember.declined_at, INVITEE_COOLDOWN_MS, now)))
  ) {
    return inviteProcessedResponse(requestId);
  }

  const { data: invitation, error: upsertError } = await supabase.from("project_members").upsert(
    {
      project_id: typedProject.id,
      user_id: knownUserId,
      role: "editor",
      invited_via: "email",
      invited_by: actor.id,
      invited_email: email,
      invited_project_name: cleanDisplayText(typedProject.name, MAX_STORED_PROJECT_NAME),
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

  const projectName = cleanDisplayText(typedProject.name, MAX_PROJECT_NAME_IN_MESSAGE);
  const title = "Shared list invitation";
  const description = `You were invited to share "${projectName}".`;
  await supabase.from("notifications").insert({
    recipient_id: knownUserId,
    title,
    description,
    type: "project-invite",
    icon: "team",
  });

  const { error: emailError } = await supabase.rpc("enqueue_email", {
    p_to_email: email,
    p_subject: INVITE_EMAIL_SUBJECT,
    p_html:
      "<h1>You have a project invitation</h1>" +
      `<p>You were invited to share <strong>${escapeHtml(projectName)}</strong> in Tickist.</p>` +
      "<p>Accept or decline it in Team.</p>" +
      emailButton("Review invitation", `${APP_URL}/app/team`),
    p_text:
      `You were invited to share "${projectName}" in Tickist.\n\n` +
      `Accept or decline it in Team: ${APP_URL}/app/team`,
    p_type: "project-invite",
    p_dedupe_key: `project-invite:${typedProject.id}:${knownUserId}:${invitation.invitation_id}`,
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
