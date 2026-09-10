import { createClient } from '@supabase/supabase-js';
import {
  OAuthError,
  OAuthErrorCode,
  type AuthInfo,
  type OAuthTokenVerifier,
} from '@modelcontextprotocol/server';
import { MCP_TOOL_SCOPES, type McpEnvironment } from './config';

interface TokenClaims {
  aud?: string | string[];
  client_id?: string;
  exp?: number;
  iss?: string;
  sub?: string;
  tickist_mcp?: boolean;
  tickist_mcp_scopes?: string[];
}

export class SupabaseTokenVerifier implements OAuthTokenVerifier {
  constructor(private readonly env: McpEnvironment) {}

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const supabase = createClient(
      this.env.SUPABASE_URL,
      this.env.SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      }
    );
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data) {
      throw new OAuthError(
        OAuthErrorCode.InvalidToken,
        'Access token signature could not be verified.'
      );
    }

    const claims = data.claims as TokenClaims;
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) {
      throw new OAuthError(
        OAuthErrorCode.InvalidToken,
        'Expired access token.'
      );
    }
    if (claims.iss !== `${this.env.SUPABASE_URL.replace(/\/$/u, '')}/auth/v1`) {
      throw new OAuthError(
        OAuthErrorCode.InvalidToken,
        'Unexpected token issuer.'
      );
    }
    if (
      !claims.tickist_mcp ||
      !claims.sub ||
      !audience.includes(this.env.MCP_ALLOWED_AUDIENCE)
    ) {
      throw new OAuthError(
        OAuthErrorCode.InvalidToken,
        'Token was not issued for Tickist MCP.'
      );
    }
    if (
      !Array.isArray(claims.tickist_mcp_scopes) ||
      !MCP_TOOL_SCOPES.every((scope) =>
        claims.tickist_mcp_scopes?.includes(scope)
      )
    ) {
      throw new OAuthError(
        OAuthErrorCode.InvalidToken,
        'Token is missing Tickist MCP tool permissions.'
      );
    }

    return {
      token,
      clientId: claims.client_id ?? 'unknown-oauth-client',
      scopes: claims.tickist_mcp_scopes,
      expiresAt: claims.exp,
      resource: new URL(this.env.MCP_RESOURCE_URL),
      extra: { userId: claims.sub },
    };
  }
}
