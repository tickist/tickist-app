import { describe, expect, it } from 'vitest';
import { requireEnvironment } from './config';

describe('requireEnvironment', () => {
  it('requires the Cloudflare rate limiting binding', () => {
    expect(() =>
      requireEnvironment({
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
        MCP_RESOURCE_URL: 'https://mcp.tickist.com/mcp',
        MCP_ALLOWED_AUDIENCE: 'https://mcp.tickist.com/mcp',
        MCP_OAUTH_ISSUER: 'https://example.supabase.co/auth/v1',
      })
    ).toThrow('MCP_RATE_LIMITER');
  });
});
