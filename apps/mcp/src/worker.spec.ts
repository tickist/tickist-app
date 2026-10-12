import type { JsonRecord } from '@tickist/data-access-tickist';
import {
  OAuthError,
  OAuthErrorCode,
  type AuthInfo,
} from '@modelcontextprotocol/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SupabaseTokenVerifier } from './auth';
import { MCP_TOOL_SCOPES, type McpEnvironment } from './config';
import { signEs256Jwt } from './testing/jwt';
import app, { clientAddressBucket } from './worker';

const env: McpEnvironment = {
  SUPABASE_URL: 'https://tickist-test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'publishable-test-key',
  MCP_RESOURCE_URL: 'https://mcp.tickist.com/mcp',
  MCP_ALLOWED_AUDIENCE: 'https://mcp.tickist.com/mcp',
  MCP_OAUTH_ISSUER: 'https://tickist-test.supabase.co/auth/v1',
  MCP_ALLOWED_HOSTS: 'mcp.tickist.com',
  MCP_RATE_LIMITER: { limit: async () => ({ success: true }) },
};

const authInfo: AuthInfo = {
  token: 'verified-access-token',
  clientId: 'test-client',
  scopes: [],
  expiresAt: Math.floor(Date.now() / 1000) + 300,
  resource: new URL(env.MCP_RESOURCE_URL),
  extra: { userId: '00000000-0000-4000-8000-000000000001' },
};

function request(body: JsonRecord, headers: HeadersInit = {}): Request {
  return new Request(env.MCP_RESOURCE_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer test-token',
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
      Host: 'mcp.tickist.com',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

afterEach(() => vi.restoreAllMocks());

describe('Tickist MCP Worker', () => {
  it('reports the current MCP protocol revision', async () => {
    const response = await app.request('https://mcp.tickist.com/health');
    expect(response.status).toBe(200);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    await expect(response.json()).resolves.toMatchObject({
      service: 'tickist-mcp',
      protocolVersion: '2026-07-28',
    });
  });

  it('serves exact path-aware protected resource metadata', async () => {
    const response = await app.request(
      'https://mcp.tickist.com/.well-known/oauth-protected-resource/mcp',
      undefined,
      env
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    await expect(response.json()).resolves.toMatchObject({
      resource: env.MCP_RESOURCE_URL,
      authorization_servers: [env.MCP_OAUTH_ISSUER],
      resource_name: 'Tickist MCP',
      scopes_supported: ['openid'],
    });
  });

  it('advertises the corrected Supabase registration endpoint', async () => {
    const response = await app.request(
      'https://mcp.tickist.com/.well-known/oauth-authorization-server',
      undefined,
      env
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      issuer: env.MCP_OAUTH_ISSUER,
      registration_endpoint: `${env.MCP_OAUTH_ISSUER}/oauth/clients/register`,
      code_challenge_methods_supported: ['S256'],
    });
  });

  it('challenges requests without a token using RFC 9728 metadata', async () => {
    const response = await app.request(
      request(
        { jsonrpc: '2.0', id: 1, method: 'server/discover' },
        {
          Authorization: '',
        }
      ),
      undefined,
      env
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(response.headers.get('www-authenticate')).toContain(
      'resource_metadata="https://mcp.tickist.com/.well-known/oauth-protected-resource/mcp"'
    );
  });

  it('returns CORS headers only for a trusted MCP origin', async () => {
    const response = await app.request(
      new Request(env.MCP_RESOURCE_URL, {
        method: 'OPTIONS',
        headers: {
          Host: 'mcp.tickist.com',
          Origin: 'https://mcp.tickist.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers':
            'Authorization, Content-Type, Mcp-Param-Task',
        },
      }),
      undefined,
      env
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(
      'https://mcp.tickist.com'
    );
    expect(response.headers.get('access-control-allow-headers')).toContain(
      'mcp-param-task'
    );
  });

  it('rejects unknown CORS request headers', async () => {
    const response = await app.request(
      new Request(env.MCP_RESOURCE_URL, {
        method: 'OPTIONS',
        headers: {
          Host: 'mcp.tickist.com',
          Origin: 'https://mcp.tickist.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'X-Untrusted-Header',
        },
      }),
      undefined,
      env
    );

    expect(response.status).toBe(403);
  });

  it('rejects untrusted Host and Origin before authentication', async () => {
    const verify = vi.spyOn(
      SupabaseTokenVerifier.prototype,
      'verifyAccessToken'
    );

    const badHost = await app.request(
      request(
        { jsonrpc: '2.0', id: 1, method: 'server/discover' },
        {
          Host: 'attacker.example',
        }
      ),
      undefined,
      env
    );

    const badOrigin = await app.request(
      request(
        { jsonrpc: '2.0', id: 1, method: 'server/discover' },
        {
          Origin: 'https://attacker.example',
        }
      ),
      undefined,
      env
    );

    expect(badHost.status).toBe(403);
    expect(badOrigin.status).toBe(403);
    expect(verify).not.toHaveBeenCalled();
  });

  it('enforces the measured body limit', async () => {
    const response = await app.request(
      new Request(env.MCP_RESOURCE_URL, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
          Host: 'mcp.tickist.com',
        },
        body: JSON.stringify({ value: 'x'.repeat(64 * 1024) }),
      }),
      undefined,
      env
    );

    expect(response.status).toBe(413);
  });

  it('rate-limits MCP requests before token verification', async () => {
    const verify = vi.spyOn(
      SupabaseTokenVerifier.prototype,
      'verifyAccessToken'
    );

    const response = await app.request(
      request({ jsonrpc: '2.0', id: 1, method: 'server/discover' }),
      undefined,
      {
        ...env,
        MCP_RATE_LIMITER: { limit: async () => ({ success: false }) },
      }
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
    expect(verify).not.toHaveBeenCalled();
  });

  it('uses one pre-auth rate-limit bucket for rotating invalid tokens', async () => {
    const keys: string[] = [];

    const rateLimitedEnv: McpEnvironment = {
      ...env,
      MCP_RATE_LIMITER: {
        limit: async ({ key }) => {
          keys.push(key);

          return { success: true };
        },
      },
    };

    for (const token of ['invalid-one', 'invalid-two']) {
      const response = await app.request(
        request(
          { jsonrpc: '2.0', id: token, method: 'server/discover' },
          {
            Authorization: `Bearer ${token}`,
            'CF-Connecting-IP': '192.0.2.10',
          }
        ),
        undefined,
        rateLimitedEnv
      );

      expect(response.status).toBe(401);
    }

    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(1);
  });

  it('serves modern discovery and legacy initialize through one SDK server', async () => {
    vi.spyOn(
      SupabaseTokenVerifier.prototype,
      'verifyAccessToken'
    ).mockResolvedValue(authInfo);

    const modern = await app.request(
      request(
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'server/discover',
          params: {
            _meta: {
              'io.modelcontextprotocol/protocolVersion': '2026-07-28',
              'io.modelcontextprotocol/clientCapabilities': {},
            },
          },
        },
        {
          'MCP-Protocol-Version': '2026-07-28',
          'Mcp-Method': 'server/discover',
        }
      ),
      undefined,
      env
    );

    expect(modern.status).toBe(200);
    await expect(modern.json()).resolves.toMatchObject({
      result: { supportedVersions: ['2026-07-28'] },
    });

    const legacy = await app.request(
      request({
        jsonrpc: '2.0',
        id: 2,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'legacy-test', version: '1.0.0' },
        },
      }),
      undefined,
      env
    );

    expect(legacy.status).toBe(200);
    await expect(legacy.text()).resolves.toContain('2025-06-18');
  });

  it('requires task and tag write scopes before associating a tag', async () => {
    vi.spyOn(
      SupabaseTokenVerifier.prototype,
      'verifyAccessToken'
    ).mockResolvedValue({ ...authInfo, scopes: ['tags:write'] });
    const fetchRequest = vi.spyOn(globalThis, 'fetch');

    const response = await app.request(
      request(
        {
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'add_tag_to_task',
            arguments: {
              task_id: '00000000-0000-4000-8000-000000000002',
              tag_id: '00000000-0000-4000-8000-000000000003',
            },
            _meta: {
              'io.modelcontextprotocol/protocolVersion': '2026-07-28',
              'io.modelcontextprotocol/clientCapabilities': {},
            },
          },
        },
        {
          'MCP-Protocol-Version': '2026-07-28',
          'Mcp-Method': 'tools/call',
          'Mcp-Name': 'add_tag_to_task',
        }
      ),
      undefined,
      env
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      result: {
        isError: true,
        content: [
          {
            type: 'text',
            text: expect.stringContaining('tasks:write'),
          },
        ],
      },
    });
    expect(fetchRequest).not.toHaveBeenCalled();
  });

  it('challenges an expired signed JWT with 401 and resource metadata', async () => {
    const fetchRequest = vi.spyOn(globalThis, 'fetch');

    const token = await signEs256Jwt({
      aud: env.MCP_ALLOWED_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) - 60,
      iss: env.MCP_OAUTH_ISSUER,
      sub: '00000000-0000-4000-8000-000000000001',
      tickist_mcp: true,
      tickist_mcp_scopes: MCP_TOOL_SCOPES,
    });

    const response = await app.request(
      request(
        { jsonrpc: '2.0', id: 1, method: 'server/discover' },
        { Authorization: `Bearer ${token}` }
      ),
      undefined,
      env
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toContain(
      'error="invalid_token"'
    );
    expect(response.headers.get('www-authenticate')).toContain(
      'resource_metadata="https://mcp.tickist.com/.well-known/oauth-protected-resource/mcp"'
    );
    expect(fetchRequest).not.toHaveBeenCalled();
  });

  it('reuses one token verifier per Worker environment', async () => {
    const verifiers: unknown[] = [];

    vi.spyOn(
      SupabaseTokenVerifier.prototype,
      'verifyAccessToken'
    ).mockImplementation(async function (this: SupabaseTokenVerifier) {
      verifiers.push(this);
      throw new OAuthError(OAuthErrorCode.InvalidToken, 'test');
    });

    const otherEnv: McpEnvironment = { ...env };

    for (const target of [env, env, otherEnv]) {
      const response = await app.request(
        request({ jsonrpc: '2.0', id: 1, method: 'server/discover' }),
        undefined,
        target
      );

      expect(response.status).toBe(401);
    }

    expect(verifiers).toHaveLength(3);
    expect(verifiers[0]).toBe(verifiers[1]);
    expect(verifiers[2]).not.toBe(verifiers[0]);
  });

  it('stops reading an undeclared streamed body once it exceeds 64 KB', async () => {
    let pulls = 0;
    const chunk = new Uint8Array(16 * 1024).fill(0x20);

    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(chunk);
      },
    });

    const verify = vi.spyOn(
      SupabaseTokenVerifier.prototype,
      'verifyAccessToken'
    );

    // Node's fetch requires `duplex` for stream bodies; the DOM RequestInit
    // type used by this project does not declare it yet.
    const streamedInit: RequestInit & { duplex: 'half' } = {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
        Host: 'mcp.tickist.com',
      },
      body,
      duplex: 'half',
    };

    const response = await app.request(
      new Request(env.MCP_RESOURCE_URL, streamedInit),
      undefined,
      env
    );

    expect(response.status).toBe(413);
    expect(pulls).toBeLessThanOrEqual(8);
    expect(verify).not.toHaveBeenCalled();
  });

  it.each(['abc', '12abc', '-1', '1e3'])(
    'rejects a non-numeric Content-Length: %s',
    async (contentLength) => {
      const response = await app.request(
        request(
          { jsonrpc: '2.0', id: 1, method: 'server/discover' },
          { 'Content-Length': contentLength }
        ),
        undefined,
        env
      );

      expect(response.status).toBe(400);
    }
  );

  it('rejects a declared Content-Length above the limit', async () => {
    const response = await app.request(
      request(
        { jsonrpc: '2.0', id: 1, method: 'server/discover' },
        { 'Content-Length': String(64 * 1024 + 1) }
      ),
      undefined,
      env
    );

    expect(response.status).toBe(413);
  });

  it.each([
    'http://mcp.tickist.com',
    'https://mcp.tickist.com:8443',
    'null',
    'https://mcp.tickist.com.attacker.example',
  ])(
    'rejects an Origin that is not an allowed https origin: %s',
    async (origin) => {
      const verify = vi.spyOn(
        SupabaseTokenVerifier.prototype,
        'verifyAccessToken'
      );

      const response = await app.request(
        request(
          { jsonrpc: '2.0', id: 1, method: 'server/discover' },
          { Origin: origin }
        ),
        undefined,
        env
      );

      expect(response.status).toBe(403);
      expect(response.headers.get('access-control-allow-origin')).toBeNull();
      expect(verify).not.toHaveBeenCalled();
    }
  );

  it('accepts the exact allowed https origin', async () => {
    const response = await app.request(
      request(
        { jsonrpc: '2.0', id: 1, method: 'server/discover' },
        { Origin: 'https://mcp.tickist.com', Authorization: '' }
      ),
      undefined,
      env
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('access-control-allow-origin')).toBe(
      'https://mcp.tickist.com'
    );
  });

  it('forwards only allowlisted headers to the legacy personal-token backend', async () => {
    const fetchRequest = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"jsonrpc":"2.0","id":1,"result":{}}', {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'x-anything',
          'Set-Cookie': 'session=legacy',
        },
      })
    );

    const response = await app.request(
      request(
        { jsonrpc: '2.0', id: 1, method: 'tools/list' },
        {
          Authorization: 'Bearer tk_personal',
          Cookie: 'session=browser',
          'CF-Connecting-IP': '192.0.2.10',
          'CF-Ray': 'ray-id',
          'X-Forwarded-For': '192.0.2.10',
          'MCP-Protocol-Version': '2025-06-18',
          'Mcp-Param-Task': 'value',
        }
      ),
      undefined,
      { ...env, LEGACY_MCP_URL: 'https://legacy.example/functions/v1/mcp' }
    );

    expect(response.status).toBe(200);
    expect(fetchRequest).toHaveBeenCalledOnce();
    const [target, init] = fetchRequest.mock.calls[0] ?? [];
    expect(String(target)).toBe('https://legacy.example/functions/v1/mcp');
    const forwarded = new Headers(init?.headers);
    expect([...forwarded.keys()].sort()).toEqual([
      'accept',
      'apikey',
      'authorization',
      'content-type',
      'mcp-param-task',
      'mcp-protocol-version',
    ]);
    expect(forwarded.get('authorization')).toBe('Bearer tk_personal');
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(response.headers.get('access-control-allow-headers')).toBeNull();
    expect(response.headers.get('set-cookie')).toBeNull();
    await expect(response.json()).resolves.toMatchObject({ id: 1 });
  });

  it.each(['http://legacy.example/mcp', 'not a url'])(
    'fails closed for a non-https legacy backend URL: %s',
    async (legacyUrl) => {
      const fetchRequest = vi.spyOn(globalThis, 'fetch');

      const response = await app.request(
        request(
          { jsonrpc: '2.0', id: 1, method: 'tools/list' },
          { Authorization: 'Bearer tk_personal' }
        ),
        undefined,
        { ...env, LEGACY_MCP_URL: legacyUrl }
      );

      expect(response.status).toBe(503);
      expect(fetchRequest).not.toHaveBeenCalled();
    }
  );

  it('applies a per-user rate-limit bucket after authentication', async () => {
    vi.spyOn(
      SupabaseTokenVerifier.prototype,
      'verifyAccessToken'
    ).mockResolvedValue(authInfo);
    const keys: string[] = [];

    const limitedEnv: McpEnvironment = {
      ...env,
      MCP_RATE_LIMITER: {
        limit: async ({ key }) => {
          keys.push(key);

          return { success: keys.length < 2 };
        },
      },
    };

    const response = await app.request(
      request(
        { jsonrpc: '2.0', id: 1, method: 'server/discover' },
        { 'CF-Connecting-IP': '192.0.2.10' }
      ),
      undefined,
      limitedEnv
    );

    expect(response.status).toBe(429);
    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it('groups IPv6 clients by /64 prefix for rate limiting', () => {
    expect(clientAddressBucket('2001:db8:1:2::1')).toBe(
      clientAddressBucket('2001:0db8:0001:0002:ffff:ffff:ffff:ffff')
    );
    expect(clientAddressBucket('2001:db8:1:2::1')).toBe(
      'ip6:2001:0db8:0001:0002::/64'
    );
    expect(clientAddressBucket('2001:db8:1:3::1')).not.toBe(
      clientAddressBucket('2001:db8:1:2::1')
    );
    expect(clientAddressBucket('::1')).toBe('ip6:0000:0000:0000:0000::/64');
    expect(clientAddressBucket('::ffff:192.0.2.10')).toBe('ip:192.0.2.10');
    expect(clientAddressBucket('192.0.2.10')).toBe('ip:192.0.2.10');
    expect(clientAddressBucket(null)).toBe('ip:unknown');
  });
});
