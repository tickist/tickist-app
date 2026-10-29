import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPABASE_CLIENT } from '../../config/supabase.provider';
import { AuthCallbackService, tokenSubject } from './auth-callback.service';
import { SupabaseSessionService } from './supabase-session.service';

describe('AuthCallbackService', () => {
  let service: AuthCallbackService;
  let currentUser: { id: string; email: string } | null;
  let setSession: ReturnType<typeof vi.fn>;
  let signOut: ReturnType<typeof vi.fn>;

  const session = {
    markPasswordRecoveryPending: vi.fn(),
    clearSession: vi.fn(),
  };

  beforeEach(async () => {
    currentUser = null;
    setSession = vi.fn(async () => ({ error: null }));
    signOut = vi.fn(async () => ({ error: null }));
    session.markPasswordRecoveryPending.mockClear();
    session.clearSession.mockClear();
    window.history.replaceState({}, '', '/');

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SupabaseSessionService, useValue: session },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            auth: {
              getSession: vi.fn(async () => ({
                data: { session: currentUser ? { user: currentUser } : null },
              })),
              setSession,
              signOut,
            },
          },
        },
      ],
    }).compileComponents();

    service = TestBed.inject(AuthCallbackService);
  });

  it('ignores URLs without link credentials', async () => {
    window.history.replaceState({}, '', '/auth/update-password#type=recovery');

    await service.consumeCallbackUrl();

    expect(setSession).not.toHaveBeenCalled();
    expect(session.markPasswordRecoveryPending).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#type=recovery');
  });

  it('applies the link session when nobody is signed in and clears the URL', async () => {
    openLink('/', token('user-1'), 'signup');

    await service.consumeCallbackUrl();

    expect(setSession).toHaveBeenCalledWith({
      access_token: token('user-1'),
      refresh_token: 'refresh',
    });
    expect(window.location.hash).toBe('');
    expect(service.accountSwitch()).toBeNull();
  });

  it('applies a link for the signed-in account without asking', async () => {
    currentUser = { id: 'user-1', email: 'one@tickist.dev' };
    openLink('/auth/update-password', token('user-1'), 'recovery');

    await service.consumeCallbackUrl();

    expect(setSession).toHaveBeenCalledOnce();
    expect(session.markPasswordRecoveryPending).toHaveBeenCalledOnce();
  });

  it('asks before a link replaces a different signed-in account', async () => {
    currentUser = { id: 'user-1', email: 'one@tickist.dev' };
    openLink('/', token('attacker'), 'signup');

    await service.consumeCallbackUrl();

    expect(setSession).not.toHaveBeenCalled();
    expect(service.accountSwitch()).toEqual({
      currentEmail: 'one@tickist.dev',
    });
    expect(window.location.hash).toBe('');
  });

  it('treats an unreadable token as another account', async () => {
    currentUser = { id: 'user-1', email: 'one@tickist.dev' };
    openLink('/', 'not-a-jwt', 'signup');

    await service.consumeCallbackUrl();

    expect(setSession).not.toHaveBeenCalled();
    expect(service.accountSwitch()).not.toBeNull();
  });

  it('signs out locally before applying a confirmed switch', async () => {
    currentUser = { id: 'user-1', email: 'one@tickist.dev' };
    openLink('/auth/update-password', token('user-2'), 'recovery');
    await service.consumeCallbackUrl();

    const applied = await service.continueWithLinkAccount();

    expect(applied).toBe(true);
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(setSession).toHaveBeenCalledOnce();
    expect(session.markPasswordRecoveryPending).toHaveBeenCalledOnce();
    expect(service.accountSwitch()).toBeNull();
  });

  it('drops the link credentials when the user stays signed in', async () => {
    currentUser = { id: 'user-1', email: 'one@tickist.dev' };
    openLink('/', token('user-2'), 'signup');
    await service.consumeCallbackUrl();

    service.cancelAccountSwitch();

    expect(await service.continueWithLinkAccount()).toBe(false);
    expect(signOut).not.toHaveBeenCalled();
    expect(setSession).not.toHaveBeenCalled();
  });

  it('does not mark recovery when the link session is rejected', async () => {
    setSession.mockResolvedValueOnce({ error: { message: 'expired' } });
    openLink('/auth/update-password', token('user-1'), 'recovery');

    await service.consumeCallbackUrl();

    expect(session.markPasswordRecoveryPending).not.toHaveBeenCalled();
  });
});

describe('tokenSubject', () => {
  it('reads the top-level sub claim', () => {
    expect(tokenSubject(token('user-1'))).toBe('user-1');
  });

  it('returns null for malformed tokens', () => {
    expect(tokenSubject('x')).toBeNull();
    expect(tokenSubject('a.%%%.c')).toBeNull();
    expect(tokenSubject(`a.${encode({ user: { sub: 'nested' } })}.c`)).toBeNull();
  });
});

function openLink(path: string, accessToken: string, type: string): void {
  window.history.replaceState(
    {},
    '',
    `${path}#access_token=${accessToken}&refresh_token=refresh&type=${type}`
  );
}

function token(sub: string): string {
  return `header.${encode({ sub, aud: 'authenticated' })}.signature`;
}

type FixtureClaims = { sub: string; aud: string } | { user: { sub: string } };

function encode(claims: FixtureClaims): string {
  return btoa(JSON.stringify(claims))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
