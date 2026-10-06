import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmailMonitoringService } from '../../data/email-monitoring.service';

@Component({
  selector: 'app-email-monitoring',
  imports: [DatePipe, RouterLink],
  templateUrl: './email-monitoring.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailMonitoringComponent {
  readonly monitor = inject(EmailMonitoringService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly now = signal(Date.now());
  readonly stale = computed(() => {
    const health = this.monitor.overview()?.health;

    return (
      !health?.monitor_available ||
      !health.checked_at ||
      this.now() - Date.parse(health.checked_at) > 10 * 60_000
    );
  });
  readonly warningLimit = computed(() => {
    const health = this.monitor.overview()?.health;

    return health?.sample
      ? Math.min(health.target_limit, health.sample.max_24h_send)
      : null;
  });

  constructor() {
    afterNextRender(() => {
      void this.monitor.refresh();
      const timer = setInterval(() => this.now.set(Date.now()), 60_000);
      this.destroyRef.onDestroy(() => clearInterval(timer));
    });
  }

  readonly labels = {
    usage_warning: '80% of warning threshold reached',
    usage_critical: '95% of warning threshold reached',
    quota_exhausted: 'SES quota exhausted',
    quota_mismatch: 'SES quota differs from expected limit',
    sending_disabled: 'SES sending disabled',
    monitor_unavailable: 'SES monitoring unavailable',
    delivery_failure: 'Application email delivery failed',
  };
  readonly statuses = {
    pending: 'Waiting to notify',
    sending: 'Sending alert',
    sent: 'Accepted by SNS',
    failed: 'Alert publication failed',
  };
}
