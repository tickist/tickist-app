import { z } from 'zod';
import { TickistDataAccess } from './data-access-tickist';
import { JsonValueSchema, type JsonValue } from './json';
import { afterEach, describe, expect, it, vi } from 'vitest';

const connection = {
  supabaseUrl: 'https://example.supabase.co',
  publishableKey: 'publishable-test-key',
  accessToken: 'user-access-token',
  userId: '00000000-0000-4000-8000-000000000001',
  clientId: 'test-client',
  scopes: [],
};

interface Call {
  method: string;
  path: string;
  params: URLSearchParams;
  body: JsonValue | undefined;
}

type Route = (call: Call) => { status?: number; body: JsonValue } | undefined;

function json(body: JsonValue, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Routes PostgREST calls; audit writes always succeed. */
function mockSupabase(route: Route): Call[] {
  const calls: Call[] = [];

  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const text = z.string().safeParse(init?.body).data;

    const call: Call = {
      method: init?.method ?? 'GET',
      path: url.pathname.replace('/rest/v1/', ''),
      params: url.searchParams,
      body: text ? JsonValueSchema.parse(JSON.parse(text)) : undefined,
    };

    calls.push(call);

    if (call.path === 'mcp_audit_events') {
      return json(call.method === 'POST' ? { id: 'audit-1' } : null);
    }

    if (call.path === 'app_users') {
      return json([{ timezone: 'Europe/Warsaw' }]);
    }

    const response = route(call);

    if (!response)
      throw new Error(`Unexpected request ${call.method} ${call.path}`);

    return json(response.body, response.status ?? 200);
  });

  return calls;
}

afterEach(() => vi.restoreAllMocks());

describe('TickistDataAccess', () => {
  it('constructs a user-token client without a service-role credential', () => {
    expect(new TickistDataAccess(connection)).toBeInstanceOf(TickistDataAccess);
  });
});

describe('TickistDataAccess time tracking', () => {
  const entry = {
    id: 'entry-1',
    task_id: '00000000-0000-4000-8000-000000000002',
    started_at: '2026-11-02T09:00:00+00:00',
    ended_at: '2026-11-02T09:30:00+00:00',
    source: 'manual',
    note: 'Review',
    created_at: '2026-11-02T10:00:00+00:00',
    updated_at: '2026-11-02T10:00:00+00:00',
    tasks: { name: 'Design' },
  };

  it('lists own entries within account-timezone day bounds', async () => {
    const calls = mockSupabase((call) =>
      call.path === 'task_time_entries'
        ? {
            body: [
              entry,
              {
                ...entry,
                id: 'entry-2',
                ended_at: '2026-11-02T09:10:00+00:00',
              },
            ],
          }
        : undefined
    );

    const result = await new TickistDataAccess(connection).listTimeEntries({
      from: '2026-11-02',
      to: '2026-11-02',
      limit: 1,
    });

    const query = calls.find((call) => call.path === 'task_time_entries');
    expect(query?.params.getAll('started_at')).toEqual([
      'gte.2026-11-01T23:00:00.000Z',
      'lt.2026-11-02T23:00:00.000Z',
    ]);
    expect(query?.params.get('owner_id')).toBe(`eq.${connection.userId}`);
    expect(query?.params.get('limit')).toBe('2');
    expect(result).toEqual({
      timezone: 'Europe/Warsaw',
      has_more: true,
      entries: [
        {
          id: 'entry-1',
          task_id: entry.task_id,
          task_name: 'Design',
          started_at: entry.started_at,
          ended_at: entry.ended_at,
          minutes: 30,
          source: 'manual',
          note: 'Review',
        },
      ],
    });
  });

  it('creates entries without client-controlled columns', async () => {
    const calls = mockSupabase((call) =>
      call.path === 'task_time_entries' && call.method === 'POST'
        ? { status: 201, body: entry }
        : undefined
    );

    const result = await new TickistDataAccess(connection).createTimeEntry({
      task_id: entry.task_id,
      started_at: '2026-11-02T10:00:00+01:00',
      ended_at: '2026-11-02T10:30:00+01:00',
      note: '  Review  ',
    });

    expect(
      calls.find((call) => call.path === 'task_time_entries')?.body
    ).toEqual({
      task_id: entry.task_id,
      started_at: '2026-11-02T10:00:00+01:00',
      ended_at: '2026-11-02T10:30:00+01:00',
      note: 'Review',
    });
    expect(result.minutes).toBe(30);
  });

  it('reports overlapping entries clearly and marks the audit as failed', async () => {
    const calls = mockSupabase((call) =>
      call.path === 'task_time_entries'
        ? {
            status: 409,
            body: {
              code: '23P01',
              message: 'conflicting key value violates exclusion constraint',
            },
          }
        : undefined
    );

    await expect(
      new TickistDataAccess(connection).createTimeEntry({
        task_id: entry.task_id,
        started_at: '2026-11-02T10:00:00Z',
        ended_at: '2026-11-02T10:30:00Z',
      })
    ).rejects.toThrow('This time overlaps another of your time entries.');

    expect(
      calls.find(
        (call) => call.path === 'mcp_audit_events' && call.method === 'PATCH'
      )?.body
    ).toMatchObject({ outcome: 'failed' });
  });

  it('rejects reversed intervals before writing', async () => {
    const calls = mockSupabase(() => undefined);

    await expect(
      new TickistDataAccess(connection).createTimeEntry({
        task_id: entry.task_id,
        started_at: '2026-11-02T10:30:00Z',
        ended_at: '2026-11-02T10:00:00Z',
      })
    ).rejects.toThrow('ended_at must be after started_at.');
    expect(calls).toHaveLength(0);
  });

  it('updates only writable columns and reports a missing entry', async () => {
    const calls = mockSupabase((call) =>
      call.path === 'task_time_entries' ? { body: [] } : undefined
    );

    await expect(
      new TickistDataAccess(connection).updateTimeEntry('entry-1', {
        note: null,
      })
    ).rejects.toThrow('Time entry not found.');
    expect(
      calls.find((call) => call.path === 'task_time_entries')?.body
    ).toEqual({
      note: null,
    });
  });

  it('deletes an own entry', async () => {
    mockSupabase((call) =>
      call.path === 'task_time_entries' && call.method === 'DELETE'
        ? { body: [{ id: 'entry-1' }] }
        : undefined
    );

    await expect(
      new TickistDataAccess(connection).deleteTimeEntry('entry-1')
    ).resolves.toEqual({ deleted: true, time_entry_id: 'entry-1' });
  });

  it('builds a tag report from the time_report RPC', async () => {
    const calls = mockSupabase((call) => {
      if (call.path === 'rpc/time_report') {
        return {
          body: [
            {
              work_date: '2026-11-02',
              task_id: 't1',
              my_seconds: 600,
              everyone_seconds: 1200,
            },
            {
              work_date: '2026-11-02',
              task_id: 't2',
              my_seconds: 300,
              everyone_seconds: 300,
            },
          ],
        };
      }

      if (call.path === 'tasks') {
        return {
          body: [
            { id: 't1', name: 'Design', project_id: 'p1' },
            { id: 't2', name: 'Admin', project_id: 'p1' },
          ],
        };
      }

      if (call.path === 'projects') {
        return { body: [{ id: 'p1', name: 'Client', ancestor_id: null }] };
      }

      if (call.path === 'task_tags') {
        return {
          body: [{ task_id: 't1', tags: { id: 'tag-1', name: 'billable' } }],
        };
      }

      return undefined;
    });

    const report = await new TickistDataAccess(connection).getTimeReport({
      from: '2026-11-01',
      to: '2026-11-30',
      group_by: 'tag',
    });

    expect(calls.find((call) => call.path === 'rpc/time_report')?.body).toEqual(
      {
        p_from: '2026-11-01',
        p_to: '2026-11-30',
      }
    );
    expect(report.total).toEqual({ me: 15, everyone: 25 });
    expect(
      report.groups.map((group) => [group.name, group.me, group.everyone])
    ).toEqual([
      ['billable', 10, 20],
      ['No tag', 5, 5],
    ]);
  });
});
