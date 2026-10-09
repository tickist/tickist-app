// Personal API token authentication for the MCP compatibility bridge.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { AuthError, parsePersonalApiToken } from './auth-token.ts';

export { AuthError } from './auth-token.ts';

export interface AuthResult {
  userId: string;
  /** Scopes selected for the personal API token. */
  scopes: readonly string[];
}

/**
 * Authenticate a request with a hashed personal API token (`tk_` prefix).
 * Supabase JWTs are rejected; OAuth clients use the dedicated MCP Worker.
 */
export const authenticateRequest = async (
  req: Request,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<AuthResult> => {
  const token = parsePersonalApiToken(req.headers.get('Authorization'));

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tokenHash = await sha256Hex(token);
  const { data: apiToken, error: tokenError } = await supabase
    .from('api_tokens')
    .select('owner_id, expires_at, scopes')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (tokenError || !apiToken) {
    throw new AuthError('Invalid or expired token');
  }

  // Check expiration
  if (apiToken.expires_at && new Date(apiToken.expires_at) < new Date()) {
    throw new AuthError('API token has expired');
  }

  // Update last_used_at (fire-and-forget)
  supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('token_hash', tokenHash)
    .then(() => {});

  const scopes = Array.isArray(apiToken.scopes)
    ? apiToken.scopes.filter(
        (scope: unknown): scope is string => typeof scope === 'string'
      )
    : [];

  return { userId: apiToken.owner_id, scopes };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};
