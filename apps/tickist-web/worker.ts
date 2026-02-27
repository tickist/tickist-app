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
  return new Response(body, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  });
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/env.js') {
      return envResponse(env);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status === 404 && shouldServeHtmlFallback(request)) {
      return fallbackToIndex(request, env);
    }

    return assetResponse;
  },
};
