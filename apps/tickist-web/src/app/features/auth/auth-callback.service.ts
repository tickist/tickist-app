import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter, take } from 'rxjs';
import { z } from 'zod';
import { SUPABASE_CLIENT } from '../../config/supabase.provider';
import { SupabaseSessionService } from './supabase-session.service';

export const ACCOUNT_SWITCH_PATH = '/auth/switch-account';

export interface AccountSwitchRequest {
  readonly currentEmail: string;
}

interface CallbackTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly recovery: boolean;
}

const TokenClaims = z.object({ sub: z.string() });

// Email links (sign-up confirmation, password recovery) carry a session in the
// URL fragment. The Supabase client does not apply it automatically
// (detectSessionInUrl is off), so a link for another account never silently
// replaces the signed-in session: the user is asked first.
@Injectable({ providedIn: 'root' })
export class AuthCallbackService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly session = inject(SupabaseSessionService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private pendingTokens: CallbackTokens | null = null;
  private readonly switchRequest = signal<AccountSwitchRequest | null>(null);

  readonly accountSwitch = this.switchRequest.asReadonly();

  async consumeCallbackUrl(): Promise<void> {
    if (!this.supabase || !this.isBrowser) {
      return;
    }

    const tokens = readCallbackTokens(window.location.hash);

    if (!tokens) {
      return;
    }

    // Keep the link credentials out of the address bar and browser history.
    window.history.replaceState(
      window.history.state,
      document.title,
      window.location.pathname + window.location.search
    );

    const { data } = await this.supabase.auth.getSession();
    const current = data.session?.user;

    if (current && tokenSubject(tokens.accessToken) !== current.id) {
      this.pendingTokens = tokens;
      this.switchRequest.set({ currentEmail: current.email ?? '' });
      this.openAccountSwitchAfterFirstNavigation();

      return;
    }

    await this.apply(tokens);
  }

  async continueWithLinkAccount(): Promise<boolean> {
    const tokens = this.pendingTokens;
    this.cancelAccountSwitch();

    if (!this.supabase || !tokens) {
      return false;
    }

    await this.supabase.auth.signOut({ scope: 'local' });
    this.session.clearSession();

    return this.apply(tokens);
  }

  cancelAccountSwitch(): void {
    this.pendingTokens = null;
    this.switchRequest.set(null);
  }

  private async apply(tokens: CallbackTokens): Promise<boolean> {
    if (!this.supabase) {
      return false;
    }

    const { error } = await this.supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });

    if (error) {
      console.warn('[Auth] Email link could not be applied.', error.message);

      return false;
    }

    if (tokens.recovery) {
      this.session.markPasswordRecoveryPending();
    }

    return true;
  }

  private openAccountSwitchAfterFirstNavigation(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        take(1)
      )
      .subscribe(() => {
        void this.router.navigateByUrl(ACCOUNT_SWITCH_PATH, {
          replaceUrl: true,
        });
      });
  }
}

function readCallbackTokens(hash: string): CallbackTokens | null {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    recovery: params.get('type') === 'recovery',
  };
}

// Reads the unverified top-level `sub` claim only to compare accounts; Supabase
// Auth verifies the token when the session is applied.
export function tokenSubject(token: string): string | null {
  const payload = token.split('.')[1];

  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');

    const json: unknown = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    );

    const claims = TokenClaims.safeParse(json);

    return claims.success ? claims.data.sub : null;
  } catch {
    return null;
  }
}
