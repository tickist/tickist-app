import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * Tests for the Cloudflare Worker /mcp proxy route.
 *
 * We test the proxyMcp logic by importing the worker's default export
 * and calling its fetch handler with crafted Request + Env objects.
 */

// Minimal AssetFetcher stub
const stubAssets = {
    fetch: vi.fn(async () => new Response('asset', { status: 200 })),
};

const buildEnv = (overrides: Record<string, string | undefined> = {}) => ({
    ASSETS: stubAssets,
    NG_APP_SUPABASE_URL: 'https://test.supabase.co',
    NG_APP_SUPABASE_PUBLISHABLE_KEY: 'test-anon-key',
    NG_APP_SUPABASE_FUNCTIONS_URL: 'https://test.supabase.co/functions/v1',
    ...overrides,
});

// We import the worker module
import worker from '../../apps/tickist-web/worker';

describe('Worker /mcp proxy', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('returns 405 for GET /mcp', async () => {
        const req = new Request('https://tickist.com/mcp', { method: 'GET' });
        const res = await worker.fetch(req, buildEnv() as any);
        expect(res.status).toBe(405);
        const body = await res.json();
        expect(body.error).toContain('Method not allowed');
    });

    it('returns 204 for OPTIONS /mcp (CORS preflight)', async () => {
        const req = new Request('https://tickist.com/mcp', { method: 'OPTIONS' });
        const res = await worker.fetch(req, buildEnv() as any);
        expect(res.status).toBe(204);
        expect(res.headers.get('access-control-allow-methods')).toContain('POST');
    });

    it('returns 413 for oversized body', async () => {
        const bigBody = 'x'.repeat(65 * 1024);
        const req = new Request('https://tickist.com/mcp', {
            method: 'POST',
            body: bigBody,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': String(bigBody.length),
            },
        });
        const res = await worker.fetch(req, buildEnv() as any);
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
        const res = await worker.fetch(req, env as any);
        expect(res.status).toBe(502);
        const body = await res.json();
        expect(body.error).toContain('not configured');
    });

    it('proxies POST /mcp to Supabase functions URL', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({ jsonrpc: '2.0', id: 1, result: { ok: true } }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
        );

        const req = new Request('https://tickist.com/mcp', {
            method: 'POST',
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }),
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer test-token',
            },
        });

        const res = await worker.fetch(req, buildEnv() as any);
        expect(res.status).toBe(200);

        // Verify the upstream fetch was called with correct URL and headers
        expect(fetchSpy).toHaveBeenCalledOnce();
        const [targetUrl, fetchOpts] = fetchSpy.mock.calls[0] as [
            string,
            RequestInit,
        ];
        expect(targetUrl).toBe(
            'https://test.supabase.co/functions/v1/tickist-mcp'
        );
        expect((fetchOpts.headers as Headers).get('Authorization')).toBe(
            'Bearer test-token'
        );
        expect((fetchOpts.headers as Headers).get('apikey')).toBe('test-anon-key');

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

        const res = await worker.fetch(req, buildEnv() as any);
        expect(res.status).toBe(502);
        const body = await res.json();
        expect(body.error).toContain('Failed to reach');

        fetchSpy.mockRestore();
    });

    it('does not proxy non-/mcp routes', async () => {
        const req = new Request('https://tickist.com/api/health', {
            method: 'POST',
        });
        const res = await worker.fetch(req, buildEnv() as any);
        // Should fall through to assets handler (404 → SPA fallback)
        expect(res.status).not.toBe(502);
    });
});
