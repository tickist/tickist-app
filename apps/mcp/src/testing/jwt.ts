// Test-only helper. It is not imported by the Worker or STDIO entrypoints.

export interface TestJwtClaims {
  aud?: string;
  exp?: number;
  iss?: string;
  sub?: string;
  tickist_mcp?: boolean;
  tickist_mcp_scopes?: readonly string[];
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCodePoint(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function base64UrlText(value: string): string {
  return base64Url(new TextEncoder().encode(value));
}

/** Signs a real ES256 JWT locally with WebCrypto; no network is involved. */
export async function signEs256Jwt(claims: TestJwtClaims): Promise<string> {
  const { privateKey } = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const header = base64UrlText(
    JSON.stringify({ alg: 'ES256', kid: 'local-test-key', typ: 'JWT' })
  );

  const body = base64UrlText(JSON.stringify(claims));

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(`${header}.${body}`)
  );

  return `${header}.${body}.${base64Url(new Uint8Array(signature))}`;
}
