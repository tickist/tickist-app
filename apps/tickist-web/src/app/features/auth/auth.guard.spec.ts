import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, test, vi } from 'vitest';
import { supabaseAuthGuard } from './auth.guard';
import { SupabaseSessionService } from './supabase-session.service';

describe('supabaseAuthGuard', () => {
  test('preserves the protected OAuth consent URL across sign-in', async () => {
    const urlTree = { redirected: true };
    const createUrlTree = vi.fn(() => urlTree);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SupabaseSessionService,
          useValue: {
            waitUntilReady: vi.fn(async () => undefined),
            user: () => null,
          },
        },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });

    const result = await TestBed.runInInjectionContext(() =>
      supabaseAuthGuard(
        {} as never,
        {
          url: '/auth/oauth/consent?authorization_id=request-1',
        } as never
      )
    );

    expect(result).toBe(urlTree);
    expect(createUrlTree).toHaveBeenCalledWith(['/auth'], {
      queryParams: {
        returnUrl: '/auth/oauth/consent?authorization_id=request-1',
      },
    });
  });
});
