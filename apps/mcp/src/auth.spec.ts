import { OAuthError } from '@modelcontextprotocol/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { decodeClaims, SupabaseTokenVerifier } from './auth';
import { MCP_TOOL_SCOPES } from './config';

function token(claims: object): string {
  const encoded = btoa(JSON.stringify(claims))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
  return `header.${encoded}.signature`;
}

describe('decodeClaims', () => {
  it('decodes URL-safe JWT claims', () => {
    expect(decodeClaims(token({ tickist_mcp: true }))).toMatchObject({
      tickist_mcp: true,
    });
  });

  it('rejects malformed tokens', () => {
    expect(() => decodeClaims('not-a-jwt')).toThrow(OAuthError);
  });
});

describe('SupabaseTokenVerifier', () => {
  const userId = '00000000-0000-4000-8000-000000000001';
  const environment = {
    SUPABASE_URL: 'https://tickist-test.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-test-key',
    MCP_RESOURCE_URL: 'https://mcp.tickist.com/mcp',
    MCP_ALLOWED_AUDIENCE: 'https://mcp.tickist.com/mcp',
    MCP_OAUTH_ISSUER: 'https://tickist-test.supabase.co/auth/v1',
    MCP_RATE_LIMITER: { limit: async () => ({ success: true }) },
  };

  afterEach(() => vi.unstubAllGlobals());

  it('accepts a live MCP OAuth token with signed tool permissions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          id: userId,
          aud: 'authenticated',
          role: 'authenticated',
          email: 'user@example.test',
          created_at: '2026-09-08T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
        })
      )
    );
    const verifier = new SupabaseTokenVerifier(environment);
    const result = await verifier.verifyAccessToken(
      token({
        aud: environment.MCP_ALLOWED_AUDIENCE,
        client_id: 'oauth-client',
        exp: Math.floor(Date.now() / 1000) + 300,
        iss: environment.MCP_OAUTH_ISSUER,
        sub: userId,
        tickist_mcp: true,
        tickist_mcp_scopes: MCP_TOOL_SCOPES,
      })
    );

    expect(result.clientId).toBe('oauth-client');
    expect(result.scopes).toEqual(MCP_TOOL_SCOPES);
    expect(result.extra?.['userId']).toBe(userId);
  });

  it('rejects an MCP token without the complete signed tool permissions', async () => {
    const fetchRequest = vi.fn();
    vi.stubGlobal('fetch', fetchRequest);
    const verifier = new SupabaseTokenVerifier(environment);

    await expect(
      verifier.verifyAccessToken(
        token({
          aud: environment.MCP_ALLOWED_AUDIENCE,
          client_id: 'oauth-client',
          exp: Math.floor(Date.now() / 1000) + 300,
          iss: environment.MCP_OAUTH_ISSUER,
          sub: userId,
          tickist_mcp: true,
          tickist_mcp_scopes: ['projects:read'],
        })
      )
    ).rejects.toThrow('missing Tickist MCP tool permissions');
    expect(fetchRequest).not.toHaveBeenCalled();
  });
});
