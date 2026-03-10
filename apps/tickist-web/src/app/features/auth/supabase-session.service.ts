import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { AuthChangeEvent, User } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.provider';

const PASSWORD_RECOVERY_STORAGE_KEY = 'tickist.password-recovery-pending';

@Injectable({ providedIn: 'root' })
export class SupabaseSessionService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly currentUser = signal<User | null>(null);
  private readonly passwordRecoveryState = signal(false);
  private readonly readyPromise: Promise<void>;
  private resolveReady: (() => void) | null = null;
  private readonly ready = signal(false);

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });

    if (!this.supabase || !this.isBrowser) {
      this.markReady();
      return;
    }

    this.passwordRecoveryState.set(this.readPasswordRecoveryPending());

    this.supabase.auth
      .getSession()
      .then(({ data }) => this.currentUser.set(data.session?.user ?? null))
      .finally(() => this.markReady());

    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser.set(session?.user ?? null);
      this.syncPasswordRecoveryState(event);
      this.markReady();
    });
  }

  user() {
    return this.currentUser();
  }

  waitUntilReady(): Promise<void> {
    return this.readyPromise;
  }

  isReady(): boolean {
    return this.ready();
  }

  passwordRecoveryPending(): boolean {
    return this.passwordRecoveryState();
  }

  markPasswordRecoveryPending(): void {
    this.setPasswordRecoveryPending(true);
  }

  clearPasswordRecoveryPending(): void {
    this.setPasswordRecoveryPending(false);
  }

  clearSession() {
    this.currentUser.set(null);
  }

  async signOut(): Promise<void> {
    if (this.supabase) {
      await this.supabase.auth.signOut();
    }
    this.clearSession();
    this.clearPasswordRecoveryPending();
  }

  async refreshUser(): Promise<void> {
    if (!this.supabase || !this.isBrowser) {
      return;
    }
    const { data, error } = await this.supabase.auth.getUser();
    if (error) {
      throw error;
    }
    this.currentUser.set(data.user ?? null);
    this.markReady();
  }

  client() {
    return this.supabase ?? null;
  }

  private syncPasswordRecoveryState(event: AuthChangeEvent): void {
    if (event === 'PASSWORD_RECOVERY') {
      this.markPasswordRecoveryPending();
      return;
    }

    if (event === 'SIGNED_OUT') {
      this.clearPasswordRecoveryPending();
    }
  }

  private readPasswordRecoveryPending(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    try {
      return sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  private setPasswordRecoveryPending(value: boolean): void {
    this.passwordRecoveryState.set(value);

    if (!this.isBrowser) {
      return;
    }

    try {
      if (value) {
        sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, '1');
      } else {
        sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures and keep the in-memory state.
    }
  }

  private markReady() {
    this.ready.set(true);
    this.resolveReady?.();
    this.resolveReady = null;
  }
}
