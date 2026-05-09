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

        this.tokens.set(
            data.map((row) => ({
                id: row.id,
                name: row.name,
                tokenPrefix: row.token_prefix,
                scopes: row.scopes ?? [],
                lastUsedAt: row.last_used_at ?? null,
                expiresAt: row.expires_at ?? null,
                createdAt: row.created_at,
            }))
        );
    }

    /**
     * Generates a new API token.
     * Returns the raw token value (shown once) plus the created record.
     */
    async createToken(
        ownerId: string,
        name: string
    ): Promise<{ rawToken: string; token: ApiToken } | null> {
        if (!this.supabase) {
            console.warn('[ApiTokens] Supabase client missing.');
            return null;
        }

        const rawToken = generateToken();
        const tokenHash = await sha256Hex(rawToken);
        const tokenPrefix = rawToken.slice(0, 8);

        const { data, error } = await this.supabase
            .from('api_tokens')
            .insert({
                owner_id: ownerId,
                name,
                token_hash: tokenHash,
                token_prefix: tokenPrefix,
            })
            .select(
                'id, name, token_prefix, scopes, last_used_at, expires_at, created_at'
            )
            .single();

        if (error || !data) {
            console.error('[ApiTokens] Failed to create token', error);
            return null;
        }

        const created: ApiToken = {
            id: data.id,
            name: data.name,
            tokenPrefix: data.token_prefix,
            scopes: data.scopes ?? [],
            lastUsedAt: data.last_used_at ?? null,
            expiresAt: data.expires_at ?? null,
            createdAt: data.created_at,
        };

        this.tokens.set([created, ...this.tokens()]);
        return { rawToken, token: created };
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

function generateToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return (
        'tk_' +
        Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
    );
}

async function sha256Hex(value: string): Promise<string> {
    const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(value)
    );
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
