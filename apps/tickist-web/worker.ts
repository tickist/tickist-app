import { GENERATED_BLOG_CONTENT } from './src/app/features/blog/blog-content.generated';

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

type BlogLocale = 'en' | 'pl';

type BlogSeo = {
  locale: BlogLocale;
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  type: 'website' | 'article';
  image?: string;
  imageAlt?: string;
  jsonLd: readonly Record<string, unknown>[];
};

const BLOG_INDEX: Readonly<
  Record<BlogLocale, { title: string; description: string }>
> = {
  en: {
    title: 'Tickist Blog | Practical task management',
    description:
      'Practical guides for calmer task management, focused projects, and sustainable productivity.',
  },
  pl: {
    title: 'Blog Tickist | Spokojne zarządzanie zadaniami',
    description:
      'Praktyczne wskazówki o spokojniejszym zarządzaniu zadaniami, projektami i produktywności.',
  },
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

export const blogSeoForUrl = (url: URL): BlogSeo | undefined => {
  const normalizedPath = url.pathname.replace(/\/$/, '') || '/';
  const match = /^\/(en|pl)\/blog(?:\/(.*))?$/.exec(normalizedPath);
  if (!match) {
    return undefined;
  }
  const locale = match[1] as BlogLocale;
  const suffix = match[2] ?? '';
  const index = BLOG_INDEX[locale];
  const basePath = `/${locale}/blog`;
  const localeArticles = GENERATED_BLOG_CONTENT.articles.filter(
    (article) => article.locale === locale
  );
  const baseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: index.title,
    description: index.description,
    url: `https://tickist.com${normalizedPath}`,
    inLanguage: locale,
    publisher: {
      '@type': 'Organization',
      name: 'Tickist',
      url: 'https://tickist.com',
    },
  };

  if (!suffix || /^page\/\d+$/.test(suffix)) {
    const page = suffix ? Number(suffix.slice('page/'.length)) : 1;
    const pageCount = Math.max(1, Math.ceil(localeArticles.length / 12));
    const invalidPage =
      !Number.isInteger(page) || (!!suffix && page < 2) || page > pageCount;
    return {
      locale,
      title: index.title,
      description: index.description,
      canonicalUrl: `https://tickist.com${normalizedPath}`,
      robots:
        url.searchParams.has('tag') || invalidPage
          ? 'noindex,follow'
          : 'index,follow,max-image-preview:large',
      type: 'website',
      jsonLd: [baseJsonLd],
    };
  }

  const categoryMatch = /^category\/([^/]+)(?:\/page\/\d+)?$/.exec(suffix);
  if (categoryMatch) {
    const category = GENERATED_BLOG_CONTENT.categories.find(
      (item) => item.locale === locale && item.slug === categoryMatch[1]
    );
    if (!category) {
      return {
        locale,
        title: index.title,
        description: index.description,
        canonicalUrl: `https://tickist.com${basePath}`,
        robots: 'noindex,follow',
        type: 'website',
        jsonLd: [],
      };
    }
    const categoryPageMatch = /\/page\/(\d+)$/.exec(suffix);
    const categoryPage = categoryPageMatch ? Number(categoryPageMatch[1]) : 1;
    const categoryPageCount = Math.max(
      1,
      Math.ceil(
        localeArticles.filter((article) => article.category === category.slug)
          .length / 12
      )
    );
    return {
      locale,
      title: `${category.name} | ${index.title}`,
      description: category.description,
      canonicalUrl: `https://tickist.com${normalizedPath}`,
      robots:
        (categoryPageMatch && categoryPage < 2) ||
        categoryPage > categoryPageCount
          ? 'noindex,follow'
          : 'index,follow,max-image-preview:large',
      type: 'website',
      jsonLd: [
        {
          ...baseJsonLd,
          '@type': 'CollectionPage',
          name: category.name,
          description: category.description,
        },
      ],
    };
  }

  const article = GENERATED_BLOG_CONTENT.articles.find(
    (item) => item.locale === locale && item.slug === suffix
  );
  if (!article) {
    return {
      locale,
      title: index.title,
      description: index.description,
      canonicalUrl: `https://tickist.com${basePath}`,
      robots: 'noindex,follow',
      type: 'website',
      jsonLd: [],
    };
  }
  const category = GENERATED_BLOG_CONTENT.categories.find(
    (item) => item.locale === locale && item.slug === article.category
  );
  const published = `${article.publishedAt}T00:00:00Z`;
  const modified = article.updatedAt
    ? `${article.updatedAt}T00:00:00Z`
    : published;
  return {
    locale,
    title: `${article.title} | Tickist`,
    description: article.description,
    canonicalUrl: `https://tickist.com${article.url}`,
    robots: 'index,follow,max-image-preview:large',
    type: 'article',
    image: `https://tickist.com${article.coverImage}`,
    imageAlt: article.coverImageAlt,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.description,
        image: `https://tickist.com${article.coverImage}`,
        datePublished: published,
        dateModified: modified,
        inLanguage: locale,
        mainEntityOfPage: `https://tickist.com${article.url}`,
        author: {
          '@type': 'Organization',
          name: 'Tickist Team',
          url: 'https://tickist.com',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Tickist',
          url: 'https://tickist.com',
        },
        articleSection: category?.name ?? article.category,
        keywords: article.tags.join(', '),
      },
    ],
  };
};

const withBlogMetadata = (response: Response, url: URL): Response => {
  const seo = blogSeoForUrl(url);
  const contentType = response.headers.get('content-type') ?? '';
  if (!seo || !contentType.includes('text/html')) {
    return response;
  }
  const image = seo.image ?? 'https://tickist.com/icons/icon-512x512.png';
  const jsonLd = seo.jsonLd
    .map(
      (entry) =>
        `<script data-blog-json-ld="true" type="application/ld+json">${JSON.stringify(
          entry
        ).replace(/</g, '\\u003c')}</script>`
    )
    .join('');
  return new HTMLRewriter()
    .on('html', {
      element: (element) => element.setAttribute('lang', seo.locale),
    })
    .on('title', {
      element: (element) => element.setInnerContent(seo.title),
    })
    .on('meta[name="description"]', {
      element: (element) => element.setAttribute('content', seo.description),
    })
    .on('head', {
      element: (element) => {
        element.append(
          `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}">` +
            `<link rel="alternate" type="application/rss+xml" href="/${
              seo.locale
            }/blog/feed.xml" title="${escapeHtml(
              seo.locale === 'pl' ? 'Blog Tickist RSS' : 'Tickist Blog RSS'
            )}">` +
            `<meta name="robots" content="${seo.robots}">` +
            `<meta property="og:type" content="${seo.type}">` +
            '<meta property="og:site_name" content="Tickist">' +
            `<meta property="og:title" content="${escapeHtml(seo.title)}">` +
            `<meta property="og:description" content="${escapeHtml(
              seo.description
            )}">` +
            `<meta property="og:url" content="${escapeHtml(
              seo.canonicalUrl
            )}">` +
            `<meta property="og:locale" content="${
              seo.locale === 'pl' ? 'pl_PL' : 'en_US'
            }">` +
            `<meta property="og:image" content="${escapeHtml(image)}">` +
            `<meta property="og:image:alt" content="${escapeHtml(
              seo.imageAlt ?? seo.title
            )}">` +
            '<meta name="twitter:card" content="summary_large_image">' +
            `<meta name="twitter:title" content="${escapeHtml(seo.title)}">` +
            `<meta name="twitter:description" content="${escapeHtml(
              seo.description
            )}">` +
            `<meta name="twitter:image" content="${escapeHtml(image)}">` +
            jsonLd,
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

const proxyMcp = async (request: Request, env: Env): Promise<Response> => {
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
    (env.NG_APP_SUPABASE_URL ? `${env.NG_APP_SUPABASE_URL}/functions/v1` : '');

  if (!functionsUrl) {
    return withSecurityHeaders(
      new Response(JSON.stringify({ error: 'MCP endpoint not configured.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  // Enforce body size limit
  const contentLength = parseInt(
    request.headers.get('content-length') ?? '0',
    10
  );
  if (contentLength > MCP_MAX_BODY_BYTES) {
    return withSecurityHeaders(
      new Response(JSON.stringify({ error: 'Request body too large.' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      })
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
    env.NG_APP_SUPABASE_PUBLISHABLE_KEY || env.NG_APP_SUPABASE_ANON_KEY || '';
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
      new Response(JSON.stringify({ error: 'Failed to reach MCP backend.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
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
