import { describe, expect, it } from 'vitest';
import { readStdioConnection } from './main';

describe('readStdioConnection', () => {
  it('builds an explicit scoped user-token connection', () => {
    expect(
      readStdioConnection({
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
        TICKIST_ACCESS_TOKEN: 'user-token',
        TICKIST_USER_ID: '00000000-0000-4000-8000-000000000001',
        TICKIST_SCOPES: 'projects:read tasks:write',
      })
    ).toMatchObject({
      clientId: 'stdio',
      scopes: ['projects:read', 'tasks:write'],
    });
  });

  it('rejects an unscoped STDIO connection', () => {
    expect(() => readStdioConnection({})).toThrow('TICKIST_SCOPES');
  });
});
