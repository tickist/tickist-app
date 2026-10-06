import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  jsonResponse,
  requireEnv,
  requireInternalFunctionSecret,
  requireSupabaseSecretKey,
} from '../_shared/common.ts';
import {
  alertMessage,
  internalRequestAllowed,
  quotaIssues,
  type EmailAlertKind,
  type EmailQuotaSample,
} from '../_shared/email-monitor.ts';
import {
  publishEmailAlert,
  readEmailQuota,
} from '../_shared/email-monitor-aws.ts';

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST')
      return jsonResponse(405, { error: 'Method not allowed' });
    if (!internalRequestAllowed(req, requireInternalFunctionSecret()))
      return jsonResponse(401, { error: 'Unauthorized' });
    const supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireSupabaseSecretKey(),
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );
    const credentials = {
      accessKeyId: requireEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('AWS_SECRET_ACCESS_KEY'),
      sessionToken: Deno.env.get('AWS_SESSION_TOKEN')?.trim(),
      region: requireEnv('AWS_REGION'),
    };
    const target = Number(
      Deno.env.get('EMAIL_MONITOR_TARGET_LIMIT')?.trim() || '100'
    );
    if (!Number.isSafeInteger(target) || target <= 0)
      throw new Error('invalid_target');
    const topicArn = Deno.env.get('EMAIL_MONITOR_SNS_TOPIC_ARN')?.trim() || '';
    let sample: EmailQuotaSample | null = null;
    try {
      sample = await readEmailQuota(credentials);
    } catch {
      // Never log AWS response bodies or request headers.
    }
    const { error: recordError } = await supabase.rpc(
      'record_email_delivery_health',
      {
        p_sample: sample,
        p_target: target,
        p_issues: sample
          ? quotaIssues(sample, target)
          : ['monitor_unavailable'],
        p_sns_configured: topicArn.length > 0,
      }
    );
    if (recordError) throw new Error('record_failed');
    let published = 0;
    let failed = 0;
    if (topicArn) {
      const worker = crypto.randomUUID();
      const { data, error } = await supabase.rpc('claim_email_monitor_alerts', {
        p_worker: worker,
      });
      if (error) throw new Error('claim_failed');
      for (const row of (data ?? []) as {
        id: string;
        kind: EmailAlertKind;
        sample: EmailQuotaSample | null;
        target_limit: number;
        claim_token: string;
      }[]) {
        let accepted = false;
        try {
          await publishEmailAlert(
            credentials,
            topicArn,
            alertMessage(row.kind, row.sample, row.target_limit)
          );
          accepted = true;
        } catch {
          failed += 1;
        }
        const { error: ackError } = await supabase.rpc(
          'finish_email_monitor_alert',
          {
            p_id: row.id,
            p_worker: row.claim_token,
            p_accepted: accepted,
          }
        );
        if (ackError) throw new Error('ack_failed');
        if (accepted) published += 1;
      }
    }
    return jsonResponse(sample && failed === 0 ? 200 : 503, {
      ok: sample !== null && failed === 0,
      sampled: sample !== null,
      sns_configured: topicArn.length > 0,
      published,
      failed,
    });
  } catch {
    console.error('[email-delivery-monitor] Monitor run failed');
    return jsonResponse(500, { error: 'Email monitoring unavailable' });
  }
});
