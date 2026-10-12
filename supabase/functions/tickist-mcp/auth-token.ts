// Dependency-free credential parsing for the personal-token MCP bridge.

export const PERSONAL_API_TOKEN_PREFIX = 'tk_';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Extracts a personal API token from an Authorization header value. Supabase
 * session or OAuth JWTs are rejected: OAuth MCP access is served only by the
 * dedicated MCP Worker, and this compatibility bridge accepts `tk_` tokens.
 */
export const parsePersonalApiToken = (
  authorizationHeader: string | null
): string => {
  const authorization = authorizationHeader?.trim() ?? '';
  if (!authorization) {
    throw new AuthError('Missing Authorization header');
  }

  const [scheme, token] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new AuthError(
      'Invalid Authorization header format. Expected: Bearer <token>'
    );
  }

  if (
    !token.startsWith(PERSONAL_API_TOKEN_PREFIX) ||
    token.length === PERSONAL_API_TOKEN_PREFIX.length
  ) {
    throw new AuthError('Only personal API tokens are accepted');
  }

  return token;
};
