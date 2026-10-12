import { Injectable, computed, inject, signal } from '@angular/core';
import { SUPABASE_CLIENT } from '../config/supabase.provider';

export interface ApiToken {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ApiTokenService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly tokens = signal<ApiToken[]>([]);
  private readonly loading = signal(false);

  readonly list = computed(() => this.tokens());
  readonly isLoading = computed(() => this.loading());

  async refresh(): Promise<void> {
    if (!this.supabase) {
      this.tokens.set([]);

      return;
    }

    this.loading.set(true);

    const { data, error } = await this.supabase
      .from('api_tokens')
      .select(
        'id, name, token_prefix, scopes, last_used_at, expires_at, created_at'
      )
      .order('created_at', { ascending: false });

    this.loading.set(false);

    if (error || !data) {
      console.warn('[ApiTokens] Unable to fetch', error);

      return;
    }

    this.tokens.set(data.map(toApiToken));
  }

  /**
   * Generates a new API token on the server.
   * Returns the raw token value (shown once) plus the created record.
   */
  async createToken(
    name: string
  ): Promise<{ rawToken: string; token: ApiToken } | null> {
    if (!this.supabase) {
      console.warn('[ApiTokens] Supabase client missing.');

      return null;
    }

    const { data, error } = await this.supabase
      .rpc('create_api_token', { p_name: name })
      .single<ApiTokenRow & { raw_token: string }>();

    if (error || !data?.raw_token) {
      console.error('[ApiTokens] Failed to create token', error);

      return null;
    }

    const created = toApiToken(data);

    this.tokens.set([created, ...this.tokens()]);

    return { rawToken: data.raw_token, token: created };
  }

  async deleteToken(tokenId: string): Promise<boolean> {
    if (!this.supabase) {
      return false;
    }

    const { error } = await this.supabase
      .from('api_tokens')
      .delete()
      .eq('id', tokenId);

    if (error) {
      console.error('[ApiTokens] Failed to delete token', error);

      return false;
    }

    this.tokens.set(this.tokens().filter((t) => t.id !== tokenId));

    return true;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface ApiTokenRow {
  id: string;
  name: string;
  token_prefix: string;
  scopes: string[] | null;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

function toApiToken(row: ApiTokenRow): ApiToken {
  return {
    id: row.id,
    name: row.name,
    tokenPrefix: row.token_prefix,
    scopes: row.scopes ?? [],
    lastUsedAt: row.last_used_at ?? null,
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at,
  };
}
