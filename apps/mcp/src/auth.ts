import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
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
  tickist_mcp_scopes?: readonly string[];
}

export interface ClaimsVerifier {
  getClaims(token: string): Promise<{
    data: { claims: TokenClaims } | null;
    error: Error | null;
  }>;
}

const TokenClaimsSchema = z.object({
  aud: z.union([z.string(), z.array(z.string())]).optional(),
  client_id: z.string().optional(),
  exp: z.number().optional(),
  iss: z.string().optional(),
  sub: z.string().optional(),
  tickist_mcp: z.boolean().optional(),
  tickist_mcp_scopes: z.array(z.string()).optional(),
});

export class SupabaseTokenVerifier implements OAuthTokenVerifier {
  constructor(
    private readonly env: McpEnvironment,
    private readonly claimsVerifier: ClaimsVerifier = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      }
    ).auth
  ) {}

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const { data, error } = await this.claimsVerifier.getClaims(token);

    if (error || !data) {
      throw new OAuthError(
        OAuthErrorCode.InvalidToken,
        'Access token signature could not be verified.'
      );
    }

    const parsedClaims = TokenClaimsSchema.safeParse(data.claims);

    if (!parsedClaims.success) {
      throw new OAuthError(
        OAuthErrorCode.InvalidToken,
        'Invalid token claims.'
      );
    }

    const claims = parsedClaims.data;
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
