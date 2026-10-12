import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import worker, {
  INLINE_SCRIPT_HASHES,
  blogSeoForUrl,
  buildContentSecurityPolicy,
} from '../worker';

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

  it('exposes independent public analytics configuration at runtime', async () => {
    const response = await worker.fetch(
      new Request('https://tickist.com/env.js'),
      buildEnv({
        NG_APP_GA4_MEASUREMENT_ID: 'G-JWF4122K8L',
        NG_APP_CLOUDFLARE_ANALYTICS_TOKEN: 'a'.repeat(32),
      })
    );

    const script = await response.text();
    expect(script).toContain('"NG_APP_GA4_MEASUREMENT_ID":"G-JWF4122K8L"');
    expect(script).toContain('"NG_APP_CLOUDFLARE_ANALYTICS_TOKEN"');
    expect(response.headers.get('Content-Security-Policy')).toContain(
      'https://www.googletagmanager.com/gtag/js'
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
  it('prevents automatic analytics injection while allowing the consented beacon', async () => {
    stubAssets.fetch.mockResolvedValueOnce(
      new Response('<html></html>', {
        headers: { 'content-type': 'text/html', 'cache-control': 'no-cache' },
      })
    );

    const response = await worker.fetch(
      new Request('https://tickist.com/app/tasks/project-id'),
      buildEnv()
    );

    expect(response.headers.get('cache-control')).toContain('no-transform');

    expect(response.headers.get('Content-Security-Policy')).toContain(
      'https://static.cloudflareinsights.com/beacon.min.js'
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serves legal pages without indexing them', async () => {
    const response = await worker.fetch(
      new Request('https://tickist.com/legal/terms/test-v1'),
      buildEnv()
    );

    expect(response.status).toBe(200);

    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
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

describe('Worker Content-Security-Policy', () => {
  const directive = (policy: string, name: string): string[] =>
    policy
      .split('; ')
      .find((entry) => entry.startsWith(`${name} `))
      ?.split(' ')
      .slice(1) ?? [];

  it('allows exactly the inline scripts in index.html by hash', () => {
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');

    const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
      (match) =>
        `'sha256-${createHash('sha256')
          .update(match[1] ?? '', 'utf8')
          .digest('base64')}'`
    );

    expect(hashes.length).toBeGreaterThan(0);
    expect([...INLINE_SCRIPT_HASHES].sort()).toEqual(hashes.sort());

    const scriptSrc = directive(buildContentSecurityPolicy({}), 'script-src');

    for (const hash of hashes) expect(scriptSrc).toContain(hash);
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it('limits connections and images to configured origins', async () => {
    const response = await worker.fetch(
      new Request('https://tickist.com/app'),
      buildEnv({
        NG_APP_SUPABASE_FUNCTIONS_URL: 'https://functions.example.com/v1',
      })
    );

    const policy = response.headers.get('Content-Security-Policy') ?? '';
    const connectSrc = directive(policy, 'connect-src');
    const imgSrc = directive(policy, 'img-src');

    expect(connectSrc).toEqual(
      expect.arrayContaining([
        "'self'",
        'https://test.supabase.co',
        'wss://test.supabase.co',
        'https://functions.example.com',
        'https://cloudflareinsights.com',
        'https://*.google-analytics.com',
      ])
    );
    expect(imgSrc).toEqual(
      expect.arrayContaining(["'self'", 'data:', 'https://test.supabase.co'])
    );

    for (const sources of [connectSrc, imgSrc]) {
      expect(sources).not.toContain('https:');
      expect(sources.join(' ')).not.toMatch(/127\.0\.0\.1|localhost/);
    }
  });

  it('ignores malformed Supabase configuration', () => {
    const policy = buildContentSecurityPolicy({
      NG_APP_SUPABASE_URL: 'not a url',
      NG_APP_SUPABASE_FUNCTIONS_URL: 'javascript:alert(1)',
    });

    expect(directive(policy, 'connect-src')).not.toContain('not');
    expect(policy).not.toContain('javascript:');
  });
});
