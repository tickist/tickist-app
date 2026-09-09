import { TickistDataAccess } from './data-access-tickist';
import { describe, expect, it } from 'vitest';

describe('TickistDataAccess', () => {
  it('constructs a user-token client without a service-role credential', () => {
    expect(
      new TickistDataAccess({
        supabaseUrl: 'https://example.supabase.co',
        publishableKey: 'publishable-test-key',
        accessToken: 'user-access-token',
        userId: '00000000-0000-4000-8000-000000000001',
        clientId: 'test-client',
        scopes: [],
      })
    ).toBeInstanceOf(TickistDataAccess);
  });
});
