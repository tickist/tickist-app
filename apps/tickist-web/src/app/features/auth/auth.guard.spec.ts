import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, test, vi } from 'vitest';
import { supabaseAuthGuard } from './auth.guard';
import { SupabaseSessionService } from './supabase-session.service';

describe('supabaseAuthGuard', () => {
  test('preserves the protected OAuth consent URL across sign-in', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: SupabaseSessionService,
          useValue: {
            waitUntilReady: vi.fn(async () => undefined),
            user: () => null,
          },
        },
      ],
    });

    const router = TestBed.inject(Router);
    const state = router.routerState.snapshot;
    Object.defineProperty(state, 'url', {
      value: '/auth/oauth/consent?authorization_id=request-1',
    });
    const urlTree = router.createUrlTree(['/auth']);

    const createUrlTree = vi
      .spyOn(router, 'createUrlTree')
      .mockReturnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() =>
      supabaseAuthGuard(state.root, state)
    );

    expect(result).toBe(urlTree);
    expect(createUrlTree).toHaveBeenCalledWith(['/auth'], {
      queryParams: {
        returnUrl: '/auth/oauth/consent?authorization_id=request-1',
      },
    });
  });
});
