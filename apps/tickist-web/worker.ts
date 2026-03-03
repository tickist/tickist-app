type AssetFetcher = {
  fetch: (request: Request) => Promise<Response>;
};

interface Env {
  ASSETS: AssetFetcher;
  NG_APP_SUPABASE_URL?: string;
  NG_APP_SUPABASE_PUBLISHABLE_KEY?: string;
  /** @deprecated Prefer NG_APP_SUPABASE_PUBLISHABLE_KEY. */
  NG_APP_SUPABASE_ANON_KEY?: string;
  NG_APP_SUPABASE_FUNCTIONS_URL?: string;
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: http://127.0.0.1:54321 http://localhost:54321",
  "frame-src 'none'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

const buildEnvPayload = (env: Env): Record<string, string> => ({
  NG_APP_SUPABASE_URL: env.NG_APP_SUPABASE_URL ?? '',
  NG_APP_SUPABASE_PUBLISHABLE_KEY:
    env.NG_APP_SUPABASE_PUBLISHABLE_KEY ?? env.NG_APP_SUPABASE_ANON_KEY ?? '',
  // Backward compatibility for deployments still reading legacy variable name.
  NG_APP_SUPABASE_ANON_KEY:
    env.NG_APP_SUPABASE_ANON_KEY ?? env.NG_APP_SUPABASE_PUBLISHABLE_KEY ?? '',
  NG_APP_SUPABASE_FUNCTIONS_URL: env.NG_APP_SUPABASE_FUNCTIONS_URL ?? '',
});

const envResponse = (env: Env): Response => {
  const body = `globalThis.__env = ${JSON.stringify(buildEnvPayload(env))};\n`;
  const response = new Response(body, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  });
  return withSecurityHeaders(response);
};

const shouldServeHtmlFallback = (request: Request): boolean => {
  if (request.method !== 'GET') {
    return false;
  }
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/html');
};

const fallbackToIndex = async (request: Request, env: Env): Promise<Response> => {
  const url = new URL(request.url);
  url.pathname = '/index.html';
  const fallbackRequest = new Request(url.toString(), {
    method: 'GET',
    headers: request.headers,
  });
  return env.ASSETS.fetch(fallbackRequest);
};

const withSecurityHeaders = (response: Response): Response => {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/env.js') {
      return envResponse(env);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status === 404 && shouldServeHtmlFallback(request)) {
      const fallbackResponse = await fallbackToIndex(request, env);
      return withSecurityHeaders(fallbackResponse);
    }

    return withSecurityHeaders(assetResponse);
  },
};
