import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.provider';
import { SupabaseSessionService } from './supabase-session.service';

describe('SupabaseSessionService password recovery state', () => {
  let service: SupabaseSessionService;
  let authStateChangeHandler:
    | ((event: AuthChangeEvent, session: Session | null) => void)
    | null;
  let signOutMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    authStateChangeHandler = null;
    signOutMock = vi.fn(async () => ({ error: null }));
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      providers: [
        SupabaseSessionService,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            auth: {
              getSession: vi.fn(async () => ({
                data: { session: null },
              })),
              onAuthStateChange: vi.fn(
                (
                  callback: (
                    event: AuthChangeEvent,
                    session: Session | null
                  ) => void
                ) => {
                  authStateChangeHandler = callback;
                  return {
                    data: {
                      subscription: {
                        unsubscribe: vi.fn(),
                      },
                    },
                  };
                }
              ),
              signOut: signOutMock,
            },
          } as unknown as SupabaseClient,
        },
      ],
    }).compileComponents();

    service = TestBed.inject(SupabaseSessionService);
    await service.waitUntilReady();
  });

  it('marks password recovery as pending when Supabase emits PASSWORD_RECOVERY', () => {
    authStateChangeHandler?.('PASSWORD_RECOVERY', {
      user: createUser(),
    } as Session);

    expect(service.passwordRecoveryPending()).toBe(true);
    expect(sessionStorage.getItem('tickist.password-recovery-pending')).toBe(
      '1'
    );
  });

  it('clears the password recovery marker on sign out', async () => {
    service.markPasswordRecoveryPending();

    await service.signOut();

    expect(signOutMock).toHaveBeenCalledOnce();
    expect(service.passwordRecoveryPending()).toBe(false);
    expect(sessionStorage.getItem('tickist.password-recovery-pending')).toBeNull();
  });
});

function createUser(): User {
  return {
    id: 'user-1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-03-10T00:00:00.000Z',
    email: 'user@tickist.dev',
  } as User;
}
