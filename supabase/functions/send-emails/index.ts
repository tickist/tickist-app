import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  getInternalFunctionSecret,
  isRecord,
  jsonResponse,
  requireEnv,
  requireInternalFunctionSecret,
  requireSupabaseSecretKey,
} from "../_shared/common.ts";
import { sendWithSes } from "../_shared/ses.ts";

interface SendEmailsPayload {
  limit?: number;
  dry_run?: boolean;
}

interface EmailOutboxRow {
  id: string;
  to_email: string;
  subject: string;
  html: string | null;
  text: string | null;
  type: string;
  dedupe_key: string;
  attempt_count: number;
  status: "queued" | "sending" | "sent" | "failed" | "dead";
}

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;
const MAX_ATTEMPTS = 10;
const STALE_SENDING_MINUTES = 15;
const EMAIL_PATTERN = /^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$/i;

const parsePositiveIntEnv = (name: string, fallback: number): number => {
  const raw = Deno.env.get(name)?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name}: expected positive integer`);
  }
  return parsed;
};

const computeBackoffSeconds = (nextAttempt: number): number => {
  const exponent = Math.min(nextAttempt, 8);
  return Math.min(600, Math.max(5, 2 ** exponent * 5));
};

const truncateError = (value: string, maxLength = 1000): string =>
  value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok");
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const requestId = crypto.randomUUID();
  try {
    const providedSecret = getInternalFunctionSecret(req);
    const internalFunctionSecret = requireInternalFunctionSecret();
    if (!providedSecret || providedSecret !== internalFunctionSecret) {
      return jsonResponse(403, { error: "Forbidden", request_id: requestId });
    }

    let payload: SendEmailsPayload = {};
    if ((req.headers.get("content-length") ?? "0") !== "0") {
      let raw: unknown;
      try {
        raw = await req.json();
      } catch {
        return jsonResponse(400, { error: "Invalid JSON payload", request_id: requestId });
      }
      if (isRecord(raw)) {
        payload = raw as SendEmailsPayload;
      }
    }
    const rawLimit = typeof payload.limit === "number"
      ? Math.floor(payload.limit)
      : DEFAULT_LIMIT;
    const limit = Math.max(1, Math.min(MAX_LIMIT, rawLimit || DEFAULT_LIMIT));
    const dryRun = payload.dry_run === true;

    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseSecretKey = requireSupabaseSecretKey();
    const supabase = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const limitPerMinute = parsePositiveIntEnv("EMAIL_RATE_LIMIT_PER_MINUTE", 1);
    const limitPerHour = parsePositiveIntEnv("EMAIL_RATE_LIMIT_PER_HOUR", 60);
    const limitPerDay = parsePositiveIntEnv("EMAIL_RATE_LIMIT_PER_DAY", 500);
    const awsRegion = requireEnv("AWS_REGION");
    const emailFrom = requireEnv("EMAIL_FROM");
    if (!EMAIL_PATTERN.test(emailFrom)) {
      throw new Error("Invalid EMAIL_FROM value");
    }
    const awsAccessKeyId = requireEnv("AWS_ACCESS_KEY_ID");
    const awsSecretAccessKey = requireEnv("AWS_SECRET_ACCESS_KEY");
    const awsSessionToken = Deno.env.get("AWS_SESSION_TOKEN")?.trim() ?? null;
    const sesConfigurationSet = Deno.env.get("SES_CONFIGURATION_SET")?.trim() ?? null;

    const summary = {
      request_id: requestId,
      dry_run: dryRun,
      fetched: 0,
      sent: 0,
      retried: 0,
      failed: 0,
      dead: 0,
      rate_limited: 0,
      released: 0,
    };

    const staleCutoffIso = new Date(
      Date.now() - STALE_SENDING_MINUTES * 60_000,
    ).toISOString();
    const { error: staleRecoveryError } = await supabase
      .from("email_outbox")
      .update({
        status: "queued",
        retry_at: new Date().toISOString(),
        last_error: "Recovered stale sending lock",
      })
      .eq("status", "sending")
      .lt("updated_at", staleCutoffIso);
    if (staleRecoveryError) {
      console.error("[send-emails] Failed stale lock recovery", {
        requestId,
        code: staleRecoveryError.code,
        message: staleRecoveryError.message,
      });
    }

    const { data: claimedRows, error: claimError } = await supabase.rpc("claim_email_outbox", {
      p_limit: limit,
    });
    if (claimError) {
      console.error("[send-emails] Failed to claim queued emails", {
        requestId,
        code: claimError.code,
        message: claimError.message,
      });
      return jsonResponse(500, { error: "Failed to claim outbox rows", request_id: requestId });
    }

    const rows = (claimedRows ?? []) as EmailOutboxRow[];
    summary.fetched = rows.length;
    if (rows.length === 0) {
      return jsonResponse(200, { ok: true, ...summary });
    }

    if (dryRun) {
      const ids = rows.map((row) => row.id);
      const { data: releasedCount, error: releaseError } = await supabase.rpc("release_email_outbox", {
        p_ids: ids,
        p_reason: "dry_run",
        p_retry_seconds: 0,
      });
      if (releaseError) {
        console.error("[send-emails] Failed to release dry-run rows", {
          requestId,
          code: releaseError.code,
          message: releaseError.message,
        });
        return jsonResponse(500, { error: "Failed to release dry-run rows", request_id: requestId });
      }
      summary.released = releasedCount ?? 0;
      return jsonResponse(200, { ok: true, ...summary });
    }

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const nextAttempt = row.attempt_count + 1;

      const { data: slotReserved, error: slotError } = await supabase.rpc("reserve_email_send_slot", {
        p_per_minute: limitPerMinute,
        p_per_hour: limitPerHour,
        p_per_day: limitPerDay,
      });

      if (slotError) {
        console.error("[send-emails] Failed rate-limit reservation", {
          requestId,
          rowId: row.id,
          code: slotError.code,
          message: slotError.message,
        });
        const idsToRelease = rows.slice(index).map((item) => item.id);
        await supabase.rpc("release_email_outbox", {
          p_ids: idsToRelease,
          p_reason: "rate_limit_check_failed",
          p_retry_seconds: 60,
        });
        summary.released += idsToRelease.length;
        summary.rate_limited += idsToRelease.length;
        break;
      }

      if (!slotReserved) {
        const idsToRelease = rows.slice(index).map((item) => item.id);
        const { data: releasedCount } = await supabase.rpc("release_email_outbox", {
          p_ids: idsToRelease,
          p_reason: "rate_limit_exceeded",
          p_retry_seconds: 60,
        });
        summary.released += releasedCount ?? idsToRelease.length;
        summary.rate_limited += idsToRelease.length;
        break;
      }

      const sendResult = await sendWithSes({
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
        sessionToken: awsSessionToken,
        region: awsRegion,
        fromEmail: emailFrom,
        toEmail: row.to_email,
        subject: row.subject,
        html: row.html,
        text: row.text,
        dedupeKey: row.dedupe_key,
        type: row.type,
        configurationSet: sesConfigurationSet,
      });

      if (sendResult.ok) {
        const { error: updateError } = await supabase
          .from("email_outbox")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            retry_at: null,
            last_error: null,
            attempt_count: nextAttempt,
          })
          .eq("id", row.id)
          .eq("status", "sending");
        if (updateError) {
          console.error("[send-emails] Failed to mark sent", {
            requestId,
            rowId: row.id,
            code: updateError.code,
            message: updateError.message,
          });
          continue;
        }
        summary.sent += 1;
        continue;
      }

      const errorText = truncateError(
        [
          sendResult.errorCode ? `code=${sendResult.errorCode}` : "",
          sendResult.errorMessage ? `message=${sendResult.errorMessage}` : "",
          `status=${sendResult.statusCode}`,
        ].filter(Boolean).join(" "),
      );

      if (sendResult.retryable && nextAttempt < MAX_ATTEMPTS) {
        const backoffSeconds = computeBackoffSeconds(nextAttempt);
        const retryAt = new Date(Date.now() + backoffSeconds * 1000).toISOString();
        const { error: retryUpdateError } = await supabase
          .from("email_outbox")
          .update({
            status: "queued",
            retry_at: retryAt,
            attempt_count: nextAttempt,
            last_error: errorText,
          })
          .eq("id", row.id)
          .eq("status", "sending");
        if (retryUpdateError) {
          console.error("[send-emails] Failed to queue retry", {
            requestId,
            rowId: row.id,
            code: retryUpdateError.code,
            message: retryUpdateError.message,
          });
        } else {
          summary.retried += 1;
        }
        continue;
      }

      const terminalStatus = nextAttempt >= MAX_ATTEMPTS ? "dead" : "failed";
      const { error: failUpdateError } = await supabase
        .from("email_outbox")
        .update({
          status: terminalStatus,
          retry_at: null,
          attempt_count: nextAttempt,
          last_error: errorText,
        })
        .eq("id", row.id)
        .eq("status", "sending");

      if (failUpdateError) {
        console.error("[send-emails] Failed to mark terminal error", {
          requestId,
          rowId: row.id,
          code: failUpdateError.code,
          message: failUpdateError.message,
        });
        continue;
      }

      if (terminalStatus === "dead") {
        summary.dead += 1;
      } else {
        summary.failed += 1;
      }
    }

    console.log("[send-emails] Batch summary", {
      requestId,
      fetched: summary.fetched,
      sent: summary.sent,
      retried: summary.retried,
      failed: summary.failed,
      dead: summary.dead,
      rateLimited: summary.rate_limited,
      released: summary.released,
    });

    return jsonResponse(200, { ok: true, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected internal error";
    console.error("[send-emails] Fatal error", { requestId, message });
    if (message.includes("Invalid JSON payload")) {
      return jsonResponse(400, { error: "Invalid JSON payload", request_id: requestId });
    }
    return jsonResponse(500, { error: "Internal server error", request_id: requestId });
  }
});
