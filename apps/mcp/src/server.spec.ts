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

  it('registers the complete project and task lifecycle catalogue', () => {
    const server = createTickistMcpServer({
      supabaseUrl: 'https://example.supabase.co',
      publishableKey: 'publishable-test-key',
      accessToken: 'user-token',
      userId: '00000000-0000-4000-8000-000000000001',
      clientId: 'test-client',
      scopes: [
        'projects:read',
        'projects:write',
        'tasks:read',
        'tasks:write',
        'tags:read',
        'tags:write',
      ],
    });
    const tools = (
      server as unknown as {
        _registeredTools: Record<
          string,
          { annotations?: Record<string, boolean> }
        >;
      }
    )._registeredTools;

    expect(Object.keys(tools)).toHaveLength(17);
    expect(Object.keys(tools)).toEqual(
      expect.arrayContaining(['delete_project', 'suspend_task', 'resume_task'])
    );
    expect(tools['delete_project'].annotations?.['destructiveHint']).toBe(true);
    expect(tools['complete_task'].annotations?.['idempotentHint']).toBe(false);
    expect(tools['resume_task'].annotations?.['idempotentHint']).toBe(true);
  });
});
