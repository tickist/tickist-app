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

type BlogSeo = {
  locale: 'en' | 'pl';
  title: string;
  description: string;
  canonicalUrl: string;
};

const BLOG_SEO_BY_PATH: Readonly<Record<string, BlogSeo>> = {
  '/en/blog': {
    locale: 'en',
    title: 'Tickist Blog | Practical task management',
    description:
      'Practical guides for calmer task management, focused projects, and sustainable productivity.',
    canonicalUrl: 'https://tickist.com/en/blog',
  },
  '/pl/blog': {
    locale: 'pl',
    title: 'Blog Tickist | Spokojne zarządzanie zadaniami',
    description:
      'Praktyczne wskazówki o spokojniejszym zarządzaniu zadaniami, projektami i produktywności.',
    canonicalUrl: 'https://tickist.com/pl/blog',
  },
};

const withBlogMetadata = (response: Response, url: URL): Response => {
  const normalizedPath = url.pathname.replace(/\/$/, '') || '/';
  const blogSeo = BLOG_SEO_BY_PATH[normalizedPath];
  const contentType = response.headers.get('content-type') ?? '';

  if (!blogSeo || !contentType.includes('text/html')) {
    return response;
  }

  return new HTMLRewriter()
    .on('html', {
      element: (element) => element.setAttribute('lang', blogSeo.locale),
    })
    .on('title', {
      element: (element) => element.setInnerContent(blogSeo.title),
    })
    .on('meta[name="description"]', {
      element: (element) =>
        element.setAttribute('content', blogSeo.description),
    })
    .on('head', {
      element: (element) => {
        element.append(
          `<link rel="canonical" href="${blogSeo.canonicalUrl}">` +
            `<meta name="robots" content="index,follow,max-image-preview:large">` +
            `<meta property="og:type" content="website">` +
            `<meta property="og:site_name" content="Tickist">` +
            `<meta property="og:title" content="${blogSeo.title}">` +
            `<meta property="og:description" content="${blogSeo.description}">` +
            `<meta property="og:url" content="${blogSeo.canonicalUrl}">` +
            `<meta property="og:locale" content="${blogSeo.locale}">` +
            `<meta name="twitter:card" content="summary">` +
            `<meta name="twitter:title" content="${blogSeo.title}">` +
            `<meta name="twitter:description" content="${blogSeo.description}">` +
            `<script id="tickist-blog-structured-data" type="application/ld+json">${JSON.stringify(
              {
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: blogSeo.title,
                description: blogSeo.description,
                url: blogSeo.canonicalUrl,
                inLanguage: blogSeo.locale,
                isPartOf: {
                  '@type': 'WebSite',
                  name: 'Tickist',
                  url: 'https://tickist.com',
                },
              }
            )}</script>`,
          { html: true }
        );
      },
    })
    .transform(response);
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

const fallbackToIndex = async (
  request: Request,
  env: Env
): Promise<Response> => {
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

const MCP_MAX_BODY_BYTES = 64 * 1024; // 64 KB limit for MCP requests

const proxyMcp = async (
  request: Request,
  env: Env
): Promise<Response> => {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (request.method !== 'POST') {
    return withSecurityHeaders(
      new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  // Resolve the Supabase Functions URL
  const functionsUrl =
    env.NG_APP_SUPABASE_FUNCTIONS_URL ||
    (env.NG_APP_SUPABASE_URL
      ? `${env.NG_APP_SUPABASE_URL}/functions/v1`
      : '');

  if (!functionsUrl) {
    return withSecurityHeaders(
      new Response(
        JSON.stringify({ error: 'MCP endpoint not configured.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }

  // Enforce body size limit
  const contentLength = parseInt(
    request.headers.get('content-length') ?? '0',
    10
  );
  if (contentLength > MCP_MAX_BODY_BYTES) {
    return withSecurityHeaders(
      new Response(
        JSON.stringify({ error: 'Request body too large.' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }

  // Build upstream request
  const targetUrl = `${functionsUrl}/tickist-mcp`;
  const upstreamHeaders = new Headers();
  upstreamHeaders.set('Content-Type', 'application/json');

  // Forward Authorization header as-is
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    upstreamHeaders.set('Authorization', authHeader);
  }

  // Supabase edge functions require apikey header
  const apiKey =
    env.NG_APP_SUPABASE_PUBLISHABLE_KEY ||
    env.NG_APP_SUPABASE_ANON_KEY ||
    '';
  if (apiKey) {
    upstreamHeaders.set('apikey', apiKey);
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: upstreamHeaders,
      body: request.body,
    });

    const responseHeaders = new Headers(upstream.headers);
    // Allow cross-origin for MCP clients
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    const response = new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
    return withSecurityHeaders(response);
  } catch {
    return withSecurityHeaders(
      new Response(
        JSON.stringify({ error: 'Failed to reach MCP backend.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/env.js') {
      return envResponse(env);
    }

    // Proxy /mcp to the Supabase tickist-mcp edge function
    if (url.pathname === '/mcp') {
      return proxyMcp(request, env);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status === 404 && shouldServeHtmlFallback(request)) {
      const fallbackResponse = await fallbackToIndex(request, env);
      return withSecurityHeaders(withBlogMetadata(fallbackResponse, url));
    }

    return withSecurityHeaders(withBlogMetadata(assetResponse, url));
  },
};
