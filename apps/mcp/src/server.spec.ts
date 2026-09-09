import { createTickistMcpServer } from './server';
import { describe, expect, it } from 'vitest';

describe('createTickistMcpServer', () => {
  it('creates the shared HTTP and STDIO server definition', () => {
    const server = createTickistMcpServer({
      supabaseUrl: 'https://example.supabase.co',
      publishableKey: 'publishable-test-key',
      accessToken: 'user-token',
      userId: '00000000-0000-4000-8000-000000000001',
      clientId: 'test-client',
      scopes: ['projects:read'],
    });
    expect(server).toBeInstanceOf(Object);
  });
});
