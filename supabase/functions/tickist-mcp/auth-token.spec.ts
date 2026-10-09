import { describe, expect, it } from 'vitest';
import { AuthError, parsePersonalApiToken } from './auth-token';

const jwtLike =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIn0.c2lnbmF0dXJl';

describe('MCP personal token parsing', () => {
  it('accepts a Bearer personal API token', () => {
    expect(parsePersonalApiToken('Bearer tk_abc123')).toBe('tk_abc123');
    expect(parsePersonalApiToken('  bearer   tk_abc123 ')).toBe('tk_abc123');
  });

  it('rejects Supabase JWTs and other non-personal tokens', () => {
    expect(() => parsePersonalApiToken(`Bearer ${jwtLike}`)).toThrow(AuthError);
    expect(() => parsePersonalApiToken('Bearer sb_secret_abc')).toThrow(
      'Only personal API tokens are accepted'
    );
    expect(() => parsePersonalApiToken('Bearer tk_')).toThrow(AuthError);
    expect(() => parsePersonalApiToken('Bearer TK_abc')).toThrow(AuthError);
  });

  it('rejects missing or malformed Authorization headers', () => {
    expect(() => parsePersonalApiToken(null)).toThrow(
      'Missing Authorization header'
    );
    expect(() => parsePersonalApiToken('   ')).toThrow(
      'Missing Authorization header'
    );
    expect(() => parsePersonalApiToken('Basic tk_abc')).toThrow(
      'Invalid Authorization header format'
    );
    expect(() => parsePersonalApiToken('Bearer')).toThrow(
      'Invalid Authorization header format'
    );
  });
});
