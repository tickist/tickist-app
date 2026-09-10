import { beforeEach, describe, expect, it, vi } from 'vitest';
import worker, { blogSeoForUrl } from '../worker';

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

describe('Worker route boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not proxy the removed legacy MCP route', async () => {
    const req = new Request('https://tickist.com/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    const res = await worker.fetch(req, buildEnv());

    expect(await res.text()).toBe('asset');
    expect(stubAssets.fetch).toHaveBeenCalledWith(req);
  });
});
