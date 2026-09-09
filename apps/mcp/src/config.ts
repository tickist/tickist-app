export const MCP_TOOL_SCOPES = [
  'projects:read',
  'projects:write',
  'tasks:read',
  'tasks:write',
  'tags:read',
  'tags:write',
] as const;

// Supabase OAuth currently accepts only its standard identity scopes.
// Fine-grained Tickist tool scopes are issued as a signed custom claim.
export const MCP_OAUTH_SCOPES = ['openid'] as const;

export interface McpRateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface McpEnvironment {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  MCP_RESOURCE_URL: string;
  MCP_ALLOWED_AUDIENCE: string;
  MCP_OAUTH_ISSUER: string;
  MCP_RATE_LIMITER: McpRateLimiter;
  MCP_ALLOWED_HOSTS?: string;
  LEGACY_MCP_URL?: string;
}

export function requireEnvironment(
  env: Partial<McpEnvironment>
): McpEnvironment {
  const keys = [
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'MCP_RESOURCE_URL',
    'MCP_ALLOWED_AUDIENCE',
    'MCP_OAUTH_ISSUER',
  ] as const;
  for (const key of keys) {
    if (!env[key]) throw new Error(`Missing environment variable: ${key}`);
  }
  if (!env.MCP_RATE_LIMITER) {
    throw new Error('Missing environment binding: MCP_RATE_LIMITER');
  }
  return env as McpEnvironment;
}
