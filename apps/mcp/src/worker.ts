import { z } from 'zod';
import {
  buildOAuthProtectedResourceMetadata,
  createMcpHandler,
  getOAuthProtectedResourceMetadataUrl,
  hostHeaderValidationResponse,
  oauthMetadataResponse,
  preloadSchemas,
  requireBearerAuth,
  type AuthInfo,
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

const app = new Hono<{ Bindings: McpEnvironment }>();

const handlers = new WeakMap<McpEnvironment, McpHttpHandler>();

type BearerGate = (request: Request) => Promise<AuthInfo | Response>;

// One verifier per environment keeps the Supabase client's JWKS cache warm
// across requests served by the same isolate.
const bearerGates = new WeakMap<McpEnvironment, BearerGate>();

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

function tooLarge(): Response {
  return Response.json({ error: 'Request body too large.' }, { status: 413 });
}

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
  const hosts = new Set<string>();

  for (const raw of [
    new URL(env.MCP_RESOURCE_URL).hostname,
    ...(env.MCP_ALLOWED_HOSTS?.split(',') ?? []),
  ]) {
    const host = raw.trim();

    if (host) hosts.add(host);
  }

  return [...hosts];
}

function allowedOrigins(env: McpEnvironment): Set<string> {
  const origins = new Set<string>();

  for (const host of allowedHosts(env)) {
    try {
      origins.add(new URL(`https://${host}`).origin);
    } catch {
      // An unparsable configured host never matches an Origin.
    }
  }

  return origins;
}

function isAllowedOrigin(origin: string, env: McpEnvironment): boolean {
  let parsed: URL;

  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  // Compare the serialized origin (scheme, host, and port) rather than only
  // the hostname, so http:// or non-default-port origins on an allowed host
  // are rejected.
  return (
    parsed.protocol === 'https:' &&
    parsed.origin === origin &&
    allowedOrigins(env).has(parsed.origin)
  );
}

function originRejection(
  request: Request,
  env: McpEnvironment
): Response | undefined {
  const origin = request.headers.get('Origin');

  if (origin === null || origin === '' || isAllowedOrigin(origin, env)) {
    return undefined;
  }

  return Response.json(
    {
      jsonrpc: '2.0',
      error: { code: -32_000, message: 'Invalid Origin.' },
      id: null,
    },
    { status: 403 }
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

  if (env && origin && isAllowedOrigin(origin, env)) {
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
      const userId = z.string().safeParse(authInfo?.extra?.['userId']).data;

      if (!authInfo || userId === undefined) {
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

function bearerGateFor(env: McpEnvironment): BearerGate {
  const current = bearerGates.get(env);

  if (current) return current;

  const gate = requireBearerAuth({
    verifier: new SupabaseTokenVerifier(env),
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(
      new URL(env.MCP_RESOURCE_URL)
    ),
  });

  bearerGates.set(env, gate);

  return gate;
}

function metadataDocumentResponse(
  request: Request,
  metadata: ReturnType<typeof buildOAuthProtectedResourceMetadata>
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

function expandIpv6(address: string): string[] | undefined {
  const halves = address.toLowerCase().split('::');

  if (halves.length > 2) return undefined;

  const parse = (part: string | undefined): string[] =>
    part ? part.split(':') : [];

  const head = parse(halves[0]);
  const tail = parse(halves[1]);
  const missing = 8 - head.length - tail.length;

  if (halves.length === 1 ? missing !== 0 : missing < 1) return undefined;

  const groups = [
    ...head,
    ...Array<string>(Math.max(missing, 0)).fill('0'),
    ...tail,
  ];

  return groups.every((group) => /^[0-9a-f]{1,4}$/u.test(group))
    ? groups.map((group) => group.padStart(4, '0'))
    : undefined;
}

/**
 * Selects the per-address rate-limit source. IPv6 clients usually control a
 * whole /64, so they share one bucket per /64 prefix.
 */
export function clientAddressBucket(address: string | null): string {
  const value = address?.trim() ?? '';

  if (!value) return 'ip:unknown';

  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/iu.exec(value);

  if (mapped) return `ip:${mapped[1]}`;

  if (!value.includes(':')) return `ip:${value}`;

  const groups = expandIpv6(value.replace(/%.*$/u, ''));

  return groups ? `ip6:${groups.slice(0, 4).join(':')}::/64` : `ip:${value}`;
}

async function hashedRateLimitKey(source: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(source)
  );

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

async function rateLimited(
  env: McpEnvironment,
  source: string
): Promise<Response | undefined> {
  const result = await env.MCP_RATE_LIMITER.limit({
    key: await hashedRateLimitKey(source),
  });

  return result.success
    ? undefined
    : Response.json(
        { error: 'rate_limit_exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
}

async function readLimitedBody(
  body: ReadableStream<Uint8Array> | null
): Promise<ArrayBuffer | Response> {
  if (!body) return new ArrayBuffer(0);

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) break;

    total += value.byteLength;

    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);

      return tooLarge();
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes.buffer;
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

  const declared = request.headers.get('Content-Length');

  if (declared !== null) {
    if (!/^\d+$/u.test(declared.trim())) {
      return Response.json(
        { error: 'Invalid Content-Length header.' },
        { status: 400 }
      );
    }

    if (Number(declared.trim()) > MAX_BODY_BYTES) return tooLarge();
  }

  // The declared length is advisory (it may be absent or wrong), so the body
  // is always counted while streaming and abandoned once it exceeds the limit.
  const body = await readLimitedBody(request.body);

  if (body instanceof Response) return body;

  try {
    JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body));
  } catch {
    return Response.json(
      { error: 'Invalid UTF-8 JSON body.' },
      { status: 400 }
    );
  }

  // oxlint-disable-next-line unicorn/no-invalid-fetch-options -- This path accepts POST only.
  return new Request(request, { body });
}

function legacyBackendUrl(env: McpEnvironment): URL | undefined {
  if (!env.LEGACY_MCP_URL) return undefined;

  try {
    const url = new URL(env.LEGACY_MCP_URL);

    return url.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

async function forwardPersonalToken(
  request: Request,
  env: McpEnvironment
): Promise<Response> {
  const target = legacyBackendUrl(env);

  // Fail closed: personal tokens are never sent to a missing, malformed, or
  // plaintext backend.
  if (!target) {
    return Response.json(
      { error: 'Personal-token compatibility backend is not configured.' },
      { status: 503 }
    );
  }

  const headers = new Headers();

  for (const [name, value] of request.headers) {
    const lower = name.toLowerCase();

    // Forward only the MCP request headers clients may send. Everything else
    // (cookies, Cloudflare and proxy metadata, Origin) stays at the edge.
    if (
      CORS_REQUEST_HEADERS.has(lower) ||
      /^mcp-param-[a-z0-9-]+$/u.test(lower)
    ) {
      headers.set(name, value);
    }
  }

  headers.set('apikey', env.SUPABASE_PUBLISHABLE_KEY);

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: await request.arrayBuffer(),
  });

  // The Worker's own CORS policy decides cross-origin access; never relay
  // the legacy backend's CORS or cookie headers. The runtime has already
  // decoded the body, so its original encoding and length no longer apply.
  const responseHeaders = new Headers();

  for (const [name, value] of upstream.headers) {
    const lower = name.toLowerCase();

    if (
      !lower.startsWith('access-control-') &&
      !['set-cookie', 'content-encoding', 'content-length'].includes(lower)
    ) {
      responseHeaders.append(name, value);
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

app.use('*', async (context, next) => {
  await next();

  const env =
    context.req.path === '/mcp' ? requireEnvironment(context.env) : undefined;

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
  const env = requireEnvironment(context.env);
  const response = oauthMetadataResponse(context.req.raw, metadataOptions(env));

  if (response) return response;

  return next();
});

app.all('/.well-known/oauth-protected-resource', (context) => {
  const env = requireEnvironment(context.env);

  return metadataDocumentResponse(
    context.req.raw,
    buildOAuthProtectedResourceMetadata(metadataOptions(env))
  );
});

app.all('/mcp', async (context) => {
  const env = requireEnvironment(context.env);
  const hosts = allowedHosts(env);

  const rejected =
    hostHeaderValidationResponse(context.req.raw, hosts) ??
    originRejection(context.req.raw, env);

  if (rejected) return rejected;

  if (context.req.raw.method === 'POST') {
    // Authentication happens after this coarse limiter, so an unverified
    // Bearer value must never select its own bucket. Otherwise arbitrary
    // token rotation would bypass the limit.
    const limited = await rateLimited(
      env,
      clientAddressBucket(context.req.raw.headers.get('CF-Connecting-IP'))
    );

    if (limited) return limited;
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

  const auth = await bearerGateFor(env)(checked);

  if (auth instanceof Response) return auth;

  const userId = z.string().safeParse(auth.extra?.['userId']).data;

  // A verified subject also gets its own bucket so one account cannot spread
  // load across many addresses.
  if (userId !== undefined) {
    const limited = await rateLimited(env, `user:${userId}`);

    if (limited) return limited;
  }

  return handlerFor(env).fetch(checked, { authInfo: auth });
});

export default app;
