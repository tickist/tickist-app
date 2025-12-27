import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { User } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.provider';

@Injectable({ providedIn: 'root' })
export class SupabaseSessionService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly currentUser = signal<User | null>(null);
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

    this.supabase.auth
      .getSession()
      .then(({ data }) => this.currentUser.set(data.session?.user ?? null))
      .finally(() => this.markReady());

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);
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

  clearSession() {
    this.currentUser.set(null);
  }

  async signOut(): Promise<void> {
    if (this.supabase) {
      await this.supabase.auth.signOut();
    }
    this.clearSession();
  }

  client() {
    return this.supabase ?? null;
  }

  private markReady() {
    this.ready.set(true);
    this.resolveReady?.();
    this.resolveReady = null;
  }
}
