import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';
import { EmailMonitoringService } from './email-monitoring.service';

const overview = {
  health: null,
  outbox: { queued: 2, sending: 0, failed: 1, sent_last_24h: 5 },
  alerts: [],
};

type MonitorReply = { data: typeof overview; error: null };

describe('EmailMonitoringService', () => {
  const user = signal<{ id: string } | null>({ id: 'administrator' });
  const rpc = vi.fn();
  beforeEach(() => {
    user.set({ id: 'administrator' });
    rpc.mockReset().mockResolvedValue({ data: false, error: null });
    TestBed.configureTestingModule({
      providers: [
        { provide: SUPABASE_CLIENT, useValue: { rpc } },
        { provide: SupabaseSessionService, useValue: { user } },
      ],
    });
  });
  test('fails closed on access errors and truthy values that are not boolean true', async () => {
    const service = TestBed.inject(EmailMonitoringService);

    for (const response of [
      { data: 'true', error: null },
      { data: true, error: {} },
    ]) {
      rpc.mockResolvedValueOnce(response);
      expect(await service.checkAccess()).toBe(false);
    }

    rpc.mockRejectedValueOnce(new Error('offline'));
    expect(await service.checkAccess()).toBe(false);
  });
  test('loads aggregates but clears them after server denial', async () => {
    const service = TestBed.inject(EmailMonitoringService);
    rpc.mockResolvedValueOnce({ data: overview, error: null });
    await service.refresh();
    expect(service.overview()?.outbox.queued).toBe(2);
    rpc.mockResolvedValueOnce({ data: null, error: { code: '42501' } });
    await service.refresh();
    expect(service.overview()).toBeNull();
    expect(service.error()).toContain('unavailable');
  });
  test('does not expose a late administrator response after account change', async () => {
    const service = TestBed.inject(EmailMonitoringService);
    let resolve: ((value: MonitorReply) => void) | undefined;
    rpc.mockReturnValueOnce(
      new Promise<MonitorReply>((done) => {
        resolve = done;
      })
    );
    const loading = service.refresh();
    user.set({ id: 'ordinary-user' });
    resolve?.({ data: overview, error: null });
    await loading;
    expect(service.overview()).toBeNull();
  });
});
