import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.provider';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseSessionService } from './supabase-session.service';

describe('SupabaseAuthService changePasswordWithCurrentPassword', () => {
  let service: SupabaseAuthService;
  let signInWithPasswordMock: ReturnType<typeof vi.fn>;
  let updateUserMock: ReturnType<typeof vi.fn>;
  let clearSessionMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    signInWithPasswordMock = vi.fn();
    updateUserMock = vi.fn();
    clearSessionMock = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        SupabaseAuthService,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            auth: {
              signInWithPassword: signInWithPasswordMock,
              updateUser: updateUserMock,
            },
          } as unknown as SupabaseClient,
        },
        {
          provide: SupabaseSessionService,
          useValue: {
            user: () => createUser(),
            clearSession: clearSessionMock,
            refreshUser: vi.fn(async () => undefined),
            signOut: vi.fn(async () => undefined),
          },
        },
      ],
    });

    service = TestBed.inject(SupabaseAuthService);
  });

  it('verifies current password before updating to a new one', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    updateUserMock.mockResolvedValue({ error: null });

    await service.changePasswordWithCurrentPassword({
      currentPassword: 'Current123!',
      newPassword: 'Updated123!',
    });

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'user@tickist.dev',
      password: 'Current123!',
    });
    expect(updateUserMock).toHaveBeenCalledWith({
      password: 'Updated123!',
    });
    expect(signInWithPasswordMock.mock.invocationCallOrder[0]).toBeLessThan(
      updateUserMock.mock.invocationCallOrder[0]
    );
  });

  it('does not clear the session when current password verification fails', async () => {
    signInWithPasswordMock.mockResolvedValue({
      error: new Error('Invalid login credentials'),
    });

    await expect(
      service.changePasswordWithCurrentPassword({
        currentPassword: 'Wrong123!',
        newPassword: 'Updated123!',
      })
    ).rejects.toThrow('Current password is incorrect.');

    expect(updateUserMock).not.toHaveBeenCalled();
    expect(clearSessionMock).not.toHaveBeenCalled();
  });
});

function createUser(): User {
  return {
    id: 'user-1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-03-09T00:00:00.000Z',
    email: 'user@tickist.dev',
  } as User;
}
