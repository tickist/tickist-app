import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  asOptionalString,
  corsHeaders,
  getBearerToken,
  isRecord,
  jsonResponse,
  requireEnv,
  requireSupabaseSecretKey,
  toSha256Hex,
} from "../_shared/common.ts";

interface EnqueuePayload {
  subject: string;
  html?: string;
  text?: string;
  type?: string;
  dedupe_key?: string;
  to_email?: string;
}

const MAX_SUBJECT_LENGTH = 200;
const MAX_HTML_LENGTH = 100_000;
const MAX_TEXT_LENGTH = 30_000;
const TYPE_PATTERN = /^[a-z0-9._-]{1,50}$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, true);
  }

  const requestId = crypto.randomUUID();
  let payload: EnqueuePayload;
  try {
    const raw = await req.json();
    if (!isRecord(raw)) {
      return jsonResponse(400, { error: "Invalid JSON payload", request_id: requestId }, true);
    }
    if (Object.prototype.hasOwnProperty.call(raw, "to_email")) {
      return jsonResponse(400, { error: "to_email is forbidden", request_id: requestId }, true);
    }
    payload = raw as EnqueuePayload;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload", request_id: requestId }, true);
  }

  const userToken = getBearerToken(req);
  if (!userToken) {
    return jsonResponse(401, { error: "Missing Authorization Bearer token", request_id: requestId }, true);
  }

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const supabaseSecretKey = requireSupabaseSecretKey();
  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(userToken);
  if (authError || !user) {
    return jsonResponse(401, { error: "Invalid user token", request_id: requestId }, true);
  }

  if (!user.email_confirmed_at) {
    return jsonResponse(403, { error: "Email is not confirmed", request_id: requestId }, true);
  }

  const subject = asOptionalString(payload.subject);
  if (!subject || subject.length > MAX_SUBJECT_LENGTH) {
    return jsonResponse(400, { error: "Invalid subject", request_id: requestId }, true);
  }

  const html = asOptionalString(payload.html);
  const text = asOptionalString(payload.text);
  if (!html && !text) {
    return jsonResponse(400, { error: "html or text is required", request_id: requestId }, true);
  }
  if (html && html.length > MAX_HTML_LENGTH) {
    return jsonResponse(400, { error: "html is too long", request_id: requestId }, true);
  }
  if (text && text.length > MAX_TEXT_LENGTH) {
    return jsonResponse(400, { error: "text is too long", request_id: requestId }, true);
  }

  const notificationType = asOptionalString(payload.type) ?? "notification";
  if (!TYPE_PATTERN.test(notificationType)) {
    return jsonResponse(400, { error: "Invalid type", request_id: requestId }, true);
  }

  const providedDedupeKey = asOptionalString(payload.dedupe_key);
  const dedupeSeed = `${subject}\n${text ?? ""}\n${html ?? ""}`;
  const generatedDigest = await toSha256Hex(dedupeSeed);
  const dedupeKey = providedDedupeKey ??
    `${notificationType}:${user.id}:${generatedDigest}`;
  if (!dedupeKey.includes(user.id)) {
    return jsonResponse(400, {
      error: "dedupe_key must contain authenticated user id",
      request_id: requestId,
    }, true);
  }

  let recipientEmail = asOptionalString(user.email)?.toLowerCase() ?? null;
  if (!recipientEmail) {
    const { data: adminData, error: adminError } = await supabase.auth.admin.getUserById(user.id);
    if (adminError || !adminData.user?.email) {
      return jsonResponse(400, {
        error: "Unable to resolve user email",
        request_id: requestId,
      }, true);
    }
    recipientEmail = adminData.user.email.trim().toLowerCase();
  }

  const { data: enqueuedId, error: enqueueError } = await supabase.rpc("enqueue_email", {
    p_to_email: recipientEmail,
    p_subject: subject,
    p_html: html,
    p_text: text,
    p_type: notificationType,
    p_dedupe_key: dedupeKey,
  });

  if (enqueueError) {
    console.error("[enqueue-notification] Failed to enqueue email", {
      requestId,
      userId: user.id,
      code: enqueueError.code,
      message: enqueueError.message,
    });
    const status = enqueueError.code?.startsWith("22") ? 400 : 500;
    return jsonResponse(status, { error: "Failed to enqueue notification", request_id: requestId }, true);
  }

  return jsonResponse(200, {
    ok: true,
    id: enqueuedId,
    deduplicated: enqueuedId === null,
    request_id: requestId,
  }, true);
});
