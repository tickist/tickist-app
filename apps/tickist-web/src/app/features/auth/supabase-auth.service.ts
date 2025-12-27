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
        'Supabase is not configured. Provide NG_APP_SUPABASE_URL and NG_APP_SUPABASE_ANON_KEY.'
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
    const { error } = await client.auth.resetPasswordForEmail(email);
    if (error) {
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await this.session.signOut();
  }
}
