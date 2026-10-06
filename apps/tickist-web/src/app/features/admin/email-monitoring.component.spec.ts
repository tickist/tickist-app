import { signal } from '@angular/core';
import { fixtureHost } from '../../../testing/dom';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, test, vi } from 'vitest';
import { EmailMonitoringComponent } from './email-monitoring.component';
import {
  EmailMonitoringService,
  type EmailOverview,
} from '../../data/email-monitoring.service';

function setup(health: EmailOverview['health']) {
  const monitor = {
    overview: signal<EmailOverview>({
      health,
      outbox: { queued: 2, sending: 0, failed: 1, sent_last_24h: 4 },
      alerts: [],
    }),
    loading: signal(false),
    error: signal<string | null>(null),
    refresh: vi.fn(async () => undefined),
  };

  TestBed.configureTestingModule({
    imports: [EmailMonitoringComponent],
    providers: [
      provideRouter([]),
      { provide: EmailMonitoringService, useValue: monitor },
    ],
  });
  const fixture = TestBed.createComponent(EmailMonitoringComponent);
  fixture.detectChanges();

  return {
    fixture,
    monitor,
    text: () => fixtureHost(fixture).textContent ?? '',
  };
}

const health = (max = 100): NonNullable<EmailOverview['health']> => ({
  sample: {
    region: 'eu-north-1',
    sent_last_24h: 95,
    max_24h_send: max,
    max_send_rate: 1,
    sending_enabled: true,
    production_access_enabled: true,
  },
  checked_at: new Date().toISOString(),
  attempted_at: new Date().toISOString(),
  target_limit: 100,
  monitor_available: true,
  sns_configured: true,
});

describe('EmailMonitoringComponent', () => {
  test('distinguishes the real AWS quota from the expected monitoring limit', () => {
    const { text } = setup(health(50000));
    expect(text()).toContain('AWS currently allows 50000 recipients');
    expect(text()).toContain('does not block sending');
    expect(text()).toContain('Combined SMTP and API usage');
    expect(text()).toContain('exclude Supabase Auth emails');
  });
  test('shows a missing monitor without invented usage', () => {
    const { text } = setup(null);
    expect(text()).toContain('Monitoring has not run yet');
    expect(text()).not.toContain('Last successful reading');
  });
  test('warns when a reading is stale or SNS publication is not configured', () => {
    const { text } = setup({
      ...health(),
      checked_at: '2020-01-01T00:00:00Z',
      monitor_available: false,
      sns_configured: false,
    });

    expect(text()).toContain('out of date');
    expect(text()).toContain('no destination configured');
  });
  test('refresh is an accessible button and reloads stored aggregates', async () => {
    const { fixture, monitor } = setup(health());

    const buttons = Array.from(
      fixtureHost(fixture).querySelectorAll('button')
    );

    const refresh = buttons.find(
      (button) => button.textContent?.trim() === 'Refresh'
    );

    expect(refresh?.type).toBe('button');
    monitor.refresh.mockClear();
    refresh?.click();
    expect(monitor.refresh).toHaveBeenCalledOnce();
  });
});
