import {
  buildOAuthProtectedResourceMetadata,
  createMcpHandler,
  getOAuthProtectedResourceMetadataUrl,
  hostHeaderValidationResponse,
  oauthMetadataResponse,
  originValidationResponse,
  preloadSchemas,
  requireBearerAuth,
  type AuthMetadataOptions,
  type McpHttpHandler,
} from '@modelcontextprotocol/server';
import { Hono } from 'hono';
import { SupabaseTokenVerifier } from './auth';
import {
  MCP_OAUTH_SCOPES,
  requireEnvironment,
  type McpEnvironment,
} from './config';
import { createTickistMcpServer } from './server';

preloadSchemas();

const app = new Hono();
const handlers = new WeakMap<McpEnvironment, McpHttpHandler>();
const MODERN_PROTOCOL_VERSION = '2026-07-28';
const MAX_BODY_BYTES = 64 * 1024;
const CORS_REQUEST_HEADERS = new Set([
  'accept',
  'authorization',
  'content-type',
  'last-event-id',
  'mcp-method',
  'mcp-name',
  'mcp-protocol-version',
  'mcp-resume-from',
  'mcp-session-id',
]);

function oauthMetadata(env: McpEnvironment) {
  const issuer = env.MCP_OAUTH_ISSUER.replace(/\/$/u, '');
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/clients/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: [...MCP_OAUTH_SCOPES],
  };
}

function metadataOptions(env: McpEnvironment): AuthMetadataOptions {
  return {
    oauthMetadata: oauthMetadata(env),
    resourceServerUrl: new URL(env.MCP_RESOURCE_URL),
    scopesSupported: [...MCP_OAUTH_SCOPES],
    resourceName: 'Tickist MCP',
  };
}

function allowedHosts(env: McpEnvironment): string[] {
  return [
    new URL(env.MCP_RESOURCE_URL).hostname,
    ...(env.MCP_ALLOWED_HOSTS?.split(',') ?? []),
  ]
    .map((host) => host.trim())
    .filter(
      (host, index, hosts) => Boolean(host) && hosts.indexOf(host) === index
    );
}

function requestedCorsHeaders(request: Request): string[] | Response {
  const requested = (
    request.headers.get('Access-Control-Request-Headers') ?? ''
  )
    .split(',')
    .map((header) => header.trim().toLowerCase())
    .filter(Boolean);
  const invalid = requested.filter(
    (header) =>
      !CORS_REQUEST_HEADERS.has(header) &&
      !/^mcp-param-[a-z0-9-]+$/u.test(header)
  );
  return invalid.length === 0
    ? requested
    : Response.json({ error: 'cors_header_forbidden' }, { status: 403 });
}

function withResponseHeaders(
  response: Response,
  request: Request,
  env?: McpEnvironment
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');

  const origin = request.headers.get('Origin');
  if (env && origin && !originValidationResponse(request, allowedHosts(env))) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.append('Vary', 'Origin');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    const requested = requestedCorsHeaders(request);
    headers.set(
      'Access-Control-Allow-Headers',
      requested instanceof Response || requested.length === 0
        ? [...CORS_REQUEST_HEADERS].join(', ')
        : requested.join(', ')
    );
    headers.set(
      'Access-Control-Expose-Headers',
      'MCP-Protocol-Version, MCP-Session-Id, WWW-Authenticate'
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function handlerFor(env: McpEnvironment): McpHttpHandler {
  const current = handlers.get(env);
  if (current) return current;
  const handler = createMcpHandler(
    ({ authInfo }) => {
      const userId = authInfo?.extra?.['userId'];
      if (!authInfo || typeof userId !== 'string') {
        throw new Error('Authenticated MCP request context is required.');
      }
      return createTickistMcpServer({
        supabaseUrl: env.SUPABASE_URL,
        publishableKey: env.SUPABASE_PUBLISHABLE_KEY,
        accessToken: authInfo.token,
        userId,
        clientId: authInfo.clientId,
        scopes: authInfo.scopes,
      });
    },
    { legacy: 'stateless' }
  );
  handlers.set(env, handler);
  return handler;
}

function metadataDocumentResponse(
  request: Request,
  metadata: object
): Response {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...headers,
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      },
    });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return Response.json(
      { error: 'method_not_allowed' },
      { status: 405, headers: { ...headers, Allow: 'GET, HEAD, OPTIONS' } }
    );
  }
  return request.method === 'HEAD'
    ? new Response(null, { headers })
    : Response.json(metadata, { headers });
}

function bearerToken(request: Request): string | undefined {
  const match = /^Bearer\s+(\S+)$/iu.exec(
    request.headers.get('Authorization')?.trim() ?? ''
  );
  return match?.[1];
}

async function rateLimitKey(request: Request): Promise<string> {
  // Authentication happens after this coarse limiter, so an unverified Bearer
  // value must never select its own bucket. Otherwise arbitrary token rotation
  // would bypass the limit.
  const source = `ip:${request.headers.get('CF-Connecting-IP') ?? 'unknown'}`;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(source)
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

async function validatedRequest(request: Request): Promise<Request | Response> {
  if (request.method === 'OPTIONS') return request;
  if (request.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 });
  }
  const contentType = request.headers
    .get('Content-Type')
    ?.split(';', 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== 'application/json') {
    return Response.json(
      { error: 'Content-Type must be application/json.' },
      { status: 415 }
    );
  }
  const declared = Number(request.headers.get('Content-Length') ?? '0');
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return Response.json({ error: 'Request body too large.' }, { status: 413 });
  }
  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BODY_BYTES) {
    return Response.json({ error: 'Request body too large.' }, { status: 413 });
  }
  try {
    JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body));
  } catch {
    return Response.json(
      { error: 'Invalid UTF-8 JSON body.' },
      { status: 400 }
    );
  }
  return new Request(request, { body });
}

async function forwardPersonalToken(
  request: Request,
  env: McpEnvironment
): Promise<Response> {
  if (!env.LEGACY_MCP_URL) {
    return Response.json(
      { error: 'Personal-token compatibility backend is not configured.' },
      { status: 503 }
    );
  }
  const headers = new Headers(request.headers);
  headers.set('apikey', env.SUPABASE_PUBLISHABLE_KEY);
  return fetch(env.LEGACY_MCP_URL, {
    method: request.method,
    headers,
    body: request.body,
  });
}

app.use('*', async (context, next) => {
  await next();
  const env =
    context.req.path === '/mcp'
      ? requireEnvironment(context.env as Partial<McpEnvironment>)
      : undefined;
  context.res = withResponseHeaders(context.res, context.req.raw, env);
});

app.get('/health', (context) =>
  context.json({
    status: 'ok',
    service: 'tickist-mcp',
    version: '2.0.0',
    protocolVersion: MODERN_PROTOCOL_VERSION,
  })
);

app.use('/.well-known/*', async (context, next) => {
  const env = requireEnvironment(context.env as Partial<McpEnvironment>);
  const response = oauthMetadataResponse(context.req.raw, metadataOptions(env));
  if (response) return response;
  return next();
});

app.all('/.well-known/oauth-protected-resource', (context) => {
  const env = requireEnvironment(context.env as Partial<McpEnvironment>);
  return metadataDocumentResponse(
    context.req.raw,
    buildOAuthProtectedResourceMetadata(metadataOptions(env))
  );
});

app.all('/mcp', async (context) => {
  const env = requireEnvironment(context.env as Partial<McpEnvironment>);
  const hosts = allowedHosts(env);
  const rejected =
    hostHeaderValidationResponse(context.req.raw, hosts) ??
    originValidationResponse(context.req.raw, hosts);
  if (rejected) return rejected;

  if (context.req.raw.method === 'POST') {
    const rateLimit = await env.MCP_RATE_LIMITER.limit({
      key: await rateLimitKey(context.req.raw),
    });
    if (!rateLimit.success) {
      return Response.json(
        { error: 'rate_limit_exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  const checked = await validatedRequest(context.req.raw);
  if (checked instanceof Response) return checked;
  if (checked.method === 'OPTIONS') {
    const requestedHeaders = requestedCorsHeaders(checked);
    return requestedHeaders instanceof Response
      ? requestedHeaders
      : new Response(null, { status: 204 });
  }

  const token = bearerToken(checked);
  if (token?.startsWith('tk_')) return forwardPersonalToken(checked, env);

  const gate = requireBearerAuth({
    verifier: new SupabaseTokenVerifier(env),
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(
      new URL(env.MCP_RESOURCE_URL)
    ),
  });
  const auth = await gate(checked);
  if (auth instanceof Response) return auth;
  return handlerFor(env).fetch(checked, { authInfo: auth });
});

export default app;
