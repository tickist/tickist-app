import { OAuthError } from '@modelcontextprotocol/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SupabaseTokenVerifier } from './auth';
import { MCP_TOOL_SCOPES } from './config';

const getClaims = vi.fn();

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

  afterEach(() => vi.clearAllMocks());

  it('accepts a signed MCP OAuth token with tool permissions', async () => {
    getClaims.mockResolvedValue({
      data: {
        claims: {
          aud: ['authenticated', environment.MCP_ALLOWED_AUDIENCE],
          client_id: 'oauth-client',
          exp: Math.floor(Date.now() / 1000) + 300,
          iss: environment.MCP_OAUTH_ISSUER,
          sub: userId,
          tickist_mcp: true,
          tickist_mcp_scopes: MCP_TOOL_SCOPES,
        },
      },
      error: null,
    });
    const verifier = new SupabaseTokenVerifier(environment, { getClaims });
    const result = await verifier.verifyAccessToken('signed.jwt.token');

    expect(getClaims).toHaveBeenCalledWith('signed.jwt.token');
    expect(result.clientId).toBe('oauth-client');
    expect(result.scopes).toEqual(MCP_TOOL_SCOPES);
    expect(result.extra?.['userId']).toBe(userId);
  });

  it('rejects an MCP token without the complete signed tool permissions', async () => {
    getClaims.mockResolvedValue({
      data: {
        claims: {
          aud: environment.MCP_ALLOWED_AUDIENCE,
          client_id: 'oauth-client',
          exp: Math.floor(Date.now() / 1000) + 300,
          iss: environment.MCP_OAUTH_ISSUER,
          sub: userId,
          tickist_mcp: true,
          tickist_mcp_scopes: ['projects:read'],
        },
      },
      error: null,
    });
    const verifier = new SupabaseTokenVerifier(environment, { getClaims });

    await expect(
      verifier.verifyAccessToken('signed.jwt.token')
    ).rejects.toThrow('missing Tickist MCP tool permissions');
  });

  it.each([
    { exp: 'not-a-number' },
    { tickist_mcp: 'true' },
    { tickist_mcp_scopes: [42] },
    { aud: {} },
  ])('rejects malformed signed claims: %j', async (fields) => {
    getClaims.mockResolvedValue({ data: { claims: fields }, error: null });
    const verifier = new SupabaseTokenVerifier(environment, { getClaims });

    await expect(
      verifier.verifyAccessToken('signed.jwt.token')
    ).rejects.toThrow('Invalid token claims');
  });

  it('rejects a token whose signature Supabase cannot verify', async () => {
    getClaims.mockResolvedValue({
      data: null,
      error: new Error('Invalid JWT signature'),
    });
    const verifier = new SupabaseTokenVerifier(environment, { getClaims });

    await expect(
      verifier.verifyAccessToken('forged.jwt.token')
    ).rejects.toThrow(OAuthError);
    await expect(
      verifier.verifyAccessToken('forged.jwt.token')
    ).rejects.toThrow('signature could not be verified');
  });
});
