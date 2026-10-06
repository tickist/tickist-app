import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, test, vi } from 'vitest';
import { EmailMonitoringService } from '../../data/email-monitoring.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { administratorGuard } from './admin.guard';

function setup(allowed: boolean) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: EmailMonitoringService,
        useValue: { checkAccess: vi.fn(async () => allowed) },
      },
      {
        provide: SupabaseSessionService,
        useValue: { waitUntilReady: vi.fn(async () => undefined) },
      },
    ],
  });
  const router = TestBed.inject(Router);
  const state = router.routerState.snapshot;

  return {
    router,
    run: () =>
      TestBed.runInInjectionContext(() =>
        administratorGuard(state.root, state)
      ),
  };
}

describe('administratorGuard', () => {
  test('admits a server-verified administrator', async () => {
    const { run } = setup(true);
    expect(await run()).toBe(true);
  });
  test('redirects a normal user away from the panel', async () => {
    const { router, run } = setup(false);
    expect(await run()).toEqual(router.createUrlTree(['/app/settings']));
  });
});
