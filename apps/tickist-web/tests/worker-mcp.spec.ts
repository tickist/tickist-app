import { beforeEach, describe, expect, it, vi } from 'vitest';
import worker, { blogSeoForUrl } from '../worker';

/**
 * Tests for the Cloudflare Worker /mcp proxy route.
 *
 * We test the proxyMcp logic by importing the worker's default export
 * and calling its fetch handler with crafted Request + Env objects.
 */

type WorkerEnv = Parameters<typeof worker.fetch>[1];

// Minimal AssetFetcher stub
const stubAssets = {
  fetch: vi.fn(async () => new Response('asset', { status: 200 })),
};

const buildEnv = (overrides: Partial<WorkerEnv> = {}): WorkerEnv => ({
  ASSETS: stubAssets,
  NG_APP_SUPABASE_URL: 'https://test.supabase.co',
  NG_APP_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  NG_APP_SUPABASE_FUNCTIONS_URL: 'https://test.supabase.co/functions/v1',
  ...overrides,
});

describe('Worker blog metadata', () => {
  it('derives index metadata and RSS discovery from the locale route', () => {
    const seo = blogSeoForUrl(new URL('https://tickist.com/pl/blog'));

    expect(seo?.locale).toBe('pl');
    expect(seo?.canonicalUrl).toBe('https://tickist.com/pl/blog');
    expect(seo?.robots).toContain('index,follow');
    expect(seo?.jsonLd[0]?.['@type']).toBe('Blog');
  });

  it('keeps tag filters and unknown article paths out of the index', () => {
    expect(
      blogSeoForUrl(new URL('https://tickist.com/en/blog?tag=planning'))?.robots
    ).toBe('noindex,follow');
    expect(
      blogSeoForUrl(new URL('https://tickist.com/en/blog/not-published'))
        ?.robots
    ).toBe('noindex,follow');
  });
});

describe('Worker /env.js runtime config', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('serves Supabase runtime config with the publishable key', async () => {
    const req = new Request('https://tickist.com/env.js', { method: 'GET' });

    const res = await worker.fetch(req, buildEnv());
    const script = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/javascript');
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(script).toContain(
      '"NG_APP_SUPABASE_URL":"https://test.supabase.co"'
    );
    expect(script).toContain(
      '"NG_APP_SUPABASE_PUBLISHABLE_KEY":"test-publishable-key"'
    );
  });

  it('falls back to the legacy anon key for deployments not migrated yet', async () => {
    const req = new Request('https://tickist.com/env.js', { method: 'GET' });

    const res = await worker.fetch(
      req,
      buildEnv({
        NG_APP_SUPABASE_PUBLISHABLE_KEY: undefined,
        NG_APP_SUPABASE_ANON_KEY: 'legacy-anon-key',
      })
    );
    const script = await res.text();

    expect(script).toContain(
      '"NG_APP_SUPABASE_PUBLISHABLE_KEY":"legacy-anon-key"'
    );
    expect(script).toContain('"NG_APP_SUPABASE_ANON_KEY":"legacy-anon-key"');
  });
});

describe('Worker /mcp proxy', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 405 for GET /mcp', async () => {
    const req = new Request('https://tickist.com/mcp', { method: 'GET' });
    const res = await worker.fetch(req, buildEnv());
    expect(res.status).toBe(405);
    const body = await res.json();
    expect(body.error).toContain('Method not allowed');
  });

  it('returns 204 for OPTIONS /mcp (CORS preflight)', async () => {
    const req = new Request('https://tickist.com/mcp', {
      method: 'OPTIONS',
      headers: { Origin: 'https://tickist.com' },
    });
    const res = await worker.fetch(req, buildEnv());
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-methods')).toContain('POST');
    expect(res.headers.get('access-control-allow-headers')).toContain(
      'mcp-protocol-version'
    );
    expect(res.headers.get('access-control-allow-origin')).toBe(
      'https://tickist.com'
    );
  });

  it('returns 403 for an untrusted Origin header', async () => {
    const req = new Request('https://tickist.com/mcp', {
      method: 'POST',
      body: '{}',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://attacker.example',
      },
    });

    const res = await worker.fetch(req, buildEnv());

    expect(res.status).toBe(403);
  });

  it('returns 415 when a POST is not JSON', async () => {
    const req = new Request('https://tickist.com/mcp', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'text/plain' },
    });

    const res = await worker.fetch(req, buildEnv());

    expect(res.status).toBe(415);
  });

  it.each([
    ['without Content-Length', undefined],
    ['with understated Content-Length', '2'],
  ])('returns 413 for oversized body %s', async (_label, contentLength) => {
    const bigBody = 'x'.repeat(65 * 1024);
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    const req = new Request('https://tickist.com/mcp', {
      method: 'POST',
      body: bigBody,
      headers,
    });
    const res = await worker.fetch(req, buildEnv());
    expect(res.status).toBe(413);
  });

  it('returns 502 when functions URL is not configured', async () => {
    const req = new Request('https://tickist.com/mcp', {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
    });
    const env = buildEnv({
      NG_APP_SUPABASE_URL: undefined,
      NG_APP_SUPABASE_FUNCTIONS_URL: undefined,
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain('not configured');
  });

  it('proxies modern MCP headers to the Supabase function', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ jsonrpc: '2.0', id: 1, result: { ok: true } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

    const req = new Request('https://tickist.com/mcp', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'list_tasks',
          arguments: { project_id: 'project-1' },
          _meta: {
            'io.modelcontextprotocol/protocolVersion': '2026-07-28',
            'io.modelcontextprotocol/clientCapabilities': {},
          },
        },
      }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: 'Bearer test-token',
        Origin: 'https://tickist.com',
        'MCP-Protocol-Version': '2026-07-28',
        'Mcp-Method': 'tools/call',
        'Mcp-Name': 'list_tasks',
        'Mcp-Param-Project': 'project-1',
      },
    });

    const res = await worker.fetch(req, buildEnv());
    expect(res.status).toBe(200);

    // Verify the upstream fetch was called with correct URL and headers.
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [targetUrl, fetchOpts] = fetchSpy.mock.calls[0] as [
      string,
      RequestInit
    ];
    expect(targetUrl).toBe('https://test.supabase.co/functions/v1/tickist-mcp');
    expect((fetchOpts.headers as Headers).get('Authorization')).toBe(
      'Bearer test-token'
    );
    expect((fetchOpts.headers as Headers).get('apikey')).toBe(
      'test-publishable-key'
    );
    expect((fetchOpts.headers as Headers).get('Accept')).toBe(
      'application/json, text/event-stream'
    );
    expect((fetchOpts.headers as Headers).get('MCP-Protocol-Version')).toBe(
      '2026-07-28'
    );
    expect((fetchOpts.headers as Headers).get('Mcp-Method')).toBe('tools/call');
    expect((fetchOpts.headers as Headers).get('Mcp-Name')).toBe('list_tasks');
    expect((fetchOpts.headers as Headers).get('Mcp-Param-Project')).toBe(
      'project-1'
    );
    expect((fetchOpts.headers as Headers).get('Origin')).toBe(
      'https://tickist.com'
    );

    fetchSpy.mockRestore();
  });

  it('returns 502 when upstream fetch fails', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('network error'));

    const req = new Request('https://tickist.com/mcp', {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await worker.fetch(req, buildEnv());
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain('Failed to reach');

    fetchSpy.mockRestore();
  });

  it('does not proxy non-/mcp routes', async () => {
    const req = new Request('https://tickist.com/api/health', {
      method: 'POST',
    });
    const res = await worker.fetch(req, buildEnv());
    // Should fall through to assets handler (404 -> SPA fallback).
    expect(res.status).not.toBe(502);
  });
});
