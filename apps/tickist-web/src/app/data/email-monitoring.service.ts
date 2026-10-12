import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { z } from 'zod';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';

const count = z.number().finite().nonnegative();

const sampleSchema = z.object({
  region: z.string(),
  sent_last_24h: count,
  max_24h_send: count,
  max_send_rate: count,
  sending_enabled: z.boolean(),
  production_access_enabled: z.boolean(),
});

export const emailOverviewSchema = z.object({
  health: z
    .object({
      sample: sampleSchema.nullable(),
      checked_at: z.string().nullable(),
      attempted_at: z.string(),
      target_limit: count.positive(),
      monitor_available: z.boolean(),
      sns_configured: z.boolean(),
    })
    .nullable(),
  outbox: z.object({
    queued: count,
    sending: count,
    failed: count,
    sent_last_24h: count,
  }),
  alerts: z.array(
    z.object({
      id: z.string(),
      kind: z.enum([
        'usage_warning',
        'usage_critical',
        'quota_exhausted',
        'sending_disabled',
        'monitor_unavailable',
        'quota_mismatch',
        'delivery_failure',
      ]),
      observed_at: z.string(),
      status: z.enum(['pending', 'sending', 'sent', 'failed']),
      attempt_count: count,
      published_at: z.string().nullable(),
    })
  ),
});

export type EmailOverview = z.infer<typeof emailOverviewSchema>;

@Injectable({ providedIn: 'root' })
export class EmailMonitoringService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly session = inject(SupabaseSessionService);
  private sequence = 0;
  readonly allowed = signal(false);
  readonly overview = signal<EmailOverview | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.session.user();
      untracked(() => {
        this.sequence += 1;
        this.allowed.set(false);
        this.overview.set(null);
        this.loading.set(false);
        this.error.set(null);
        void this.checkAccess();
      });
    });
  }

  async checkAccess(): Promise<boolean> {
    const userId = this.session.user()?.id;

    this.allowed.set(false);

    if (!this.supabase || !userId) return false;

    try {
      const { data, error } = await this.supabase.rpc('is_app_administrator');

      if (this.session.user()?.id !== userId) return false;
      const allowed = !error && data === true;
      this.allowed.set(allowed);

      return allowed;
    } catch {
      this.allowed.set(false);

      return false;
    }
  }

  async refresh(): Promise<void> {
    const sequence = ++this.sequence;
    const userId = this.session.user()?.id;
    this.loading.set(true);
    this.error.set(null);
    // Do not leave old administrator data on screen if membership was revoked.
    this.overview.set(null);

    try {
      if (!this.supabase || !userId) throw new Error('unavailable');

      const { data, error } = await this.supabase.rpc(
        'get_email_delivery_overview'
      );

      if (sequence !== this.sequence || this.session.user()?.id !== userId)
        return;
      const parsed = emailOverviewSchema.safeParse(data);

      if (error || !parsed.success) throw new Error('unavailable');
      this.overview.set(parsed.data);
    } catch {
      if (sequence === this.sequence)
        this.error.set('Email monitoring is unavailable. Try again later.');
    } finally {
      if (sequence === this.sequence) this.loading.set(false);
    }
  }
}
