import { Injectable, inject } from '@angular/core';
import type { AuthResponse } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.provider';
import { SupabaseSessionService } from './supabase-session.service';

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseAuthService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly session = inject(SupabaseSessionService);

  private ensureClient() {
    if (!this.supabase) {
      throw new Error(
        'Supabase is not configured. Provide NG_APP_SUPABASE_URL and NG_APP_SUPABASE_PUBLISHABLE_KEY.'
      );
    }
    return this.supabase;
  }

  async signInWithPassword(payload: SignInPayload): Promise<AuthResponse> {
    const client = this.ensureClient();
    const response = await client.auth.signInWithPassword(payload);
    if (response.error) {
      this.session.clearSession();
    }
    return response;
  }

  async signUpWithPassword(payload: SignUpPayload): Promise<AuthResponse> {
    const client = this.ensureClient();
    return client.auth.signUp(payload);
  }

  async sendPasswordReset(email: string): Promise<void> {
    const client = this.ensureClient();
    const redirectTo = this.getPasswordResetRedirectTo();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      throw error;
    }
  }

  async updatePassword(password: string): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client.auth.updateUser({ password });
    if (error) {
      throw error;
    }
  }

  async updateProfileMetadata(patch: Record<string, unknown>): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client.auth.updateUser({ data: patch });
    if (error) {
      throw error;
    }
    await this.session.refreshUser();
  }

  async signOut(): Promise<void> {
    await this.session.signOut();
  }

  private getPasswordResetRedirectTo(): string {
    if (typeof window === 'undefined') {
      return 'http://localhost:4200/auth/update-password';
    }
    return `${window.location.origin}/auth/update-password`;
  }
}
