import assert from 'node:assert/strict';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';
import {
  ProjectDataService,
  isProjectSharedByMultipleMembers,
} from './project-data.service';
import { StatisticsDataService } from './statistics-data.service';

type ProjectRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  is_inbox: boolean;
  project_type: string | null;
  ancestor_id: string | null;
  task_view: string | null;
  default_priority: string | null;
  default_finish_date: number | null;
  default_type_finish_date: number | null;
  dialog_time_when_task_finished: boolean | null;
  project_members?: LegacyProjectMemberRow[];
};

type LegacyProjectMemberRow = {
  project_id: string;
  user_id: string;
  role: string | null;
  invited_at: string | null;
};

describe('ProjectDataService schema compatibility', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('uses legacy project member selects without probing missing rollout columns', async () => {
    const supabase = createSupabaseMock();

    TestBed.configureTestingModule({
      providers: [
        ProjectDataService,
        {
          provide: SUPABASE_CLIENT,
          useValue: supabase,
        },
        {
          provide: SupabaseSessionService,
          useValue: {
            user: vi.fn(() => null),
            signOut: vi.fn(async () => undefined),
          },
        },
        {
          provide: StatisticsDataService,
          useValue: {
            markDirty: vi.fn(),
          },
        },
      ],
    });

    const service = TestBed.inject(ProjectDataService);
    await flushPromises();

    expect(service.list()).toEqual([
      expect.objectContaining({
        id: 'project-1',
        shareWithIds: ['member-1'],
        members: [
          expect.objectContaining({
            userId: 'member-1',
            status: 'accepted',
            role: 'viewer',
          }),
        ],
      }),
    ]);
    expect(service.membershipsList()).toEqual([
      expect.objectContaining({
        projectId: 'project-1',
        userId: 'member-1',
        status: 'accepted',
      }),
    ]);
    expect(supabase.projectSelects).toHaveLength(1);
    expect(supabase.projectSelects[0]).not.toContain('status');
    expect(supabase.membershipSelects).toHaveLength(1);
    expect(supabase.membershipSelects[0]).not.toContain('status');
  });

  it('returns the existing inbox when create races the unique inbox constraint', async () => {
    const supabase = createInboxConflictSupabaseMock();

    TestBed.configureTestingModule({
      providers: [
        ProjectDataService,
        {
          provide: SUPABASE_CLIENT,
          useValue: supabase,
        },
        {
          provide: SupabaseSessionService,
          useValue: {
            user: vi.fn(() => null),
            signOut: vi.fn(async () => undefined),
          },
        },
        {
          provide: StatisticsDataService,
          useValue: {
            markDirty: vi.fn(),
          },
        },
      ],
    });

    const service = TestBed.inject(ProjectDataService);
    await flushPromises();

    const project = await service.createProject({
      ownerId: 'owner-1',
      name: 'Inbox',
      isInbox: true,
    });

    expect(project).toEqual(
      expect.objectContaining({
        id: 'inbox-1',
        ownerId: 'owner-1',
        isInbox: true,
      })
    );
    expect(service.list()).toEqual([
      expect.objectContaining({
        id: 'inbox-1',
        isInbox: true,
      }),
    ]);
  });
});

describe('isProjectSharedByMultipleMembers', () => {
  it('requires at least two accepted members', () => {
    assert.equal(
      isProjectSharedByMultipleMembers({
        members: [createProjectMember('member-1')],
      }),
      false
    );
    assert.equal(
      isProjectSharedByMultipleMembers({
        members: [
          createProjectMember('member-1'),
          createProjectMember('member-2', 'pending'),
        ],
      }),
      false
    );
    assert.equal(
      isProjectSharedByMultipleMembers({
        members: [
          createProjectMember('member-1'),
          createProjectMember('member-2'),
        ],
      }),
      true
    );
  });
});

function createSupabaseMock(): {
  from: ReturnType<typeof vi.fn>;
  projectSelects: string[];
  membershipSelects: string[];
} {
  const projectSelects: string[] = [];
  const membershipSelects: string[] = [];

  return {
    projectSelects,
    membershipSelects,
    from: vi.fn((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn((columns: string) => {
            projectSelects.push(columns);
            return Promise.resolve({ data: [legacyProjectRow()], error: null });
          }),
        };
      }
      if (table === 'project_members') {
        return {
          select: vi.fn((columns: string) => {
            membershipSelects.push(columns);
            return {
              order: vi.fn(async () =>
                ({ data: [legacyMemberRow()], error: null })
              ),
            };
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function createInboxConflictSupabaseMock(): { from: ReturnType<typeof vi.fn> } {
  const inboxRow = legacyProjectRow({
    id: 'inbox-1',
    name: 'Inbox',
    is_inbox: true,
    project_members: [],
  });
  let shouldReturnInbox = false;

  return {
    from: vi.fn((table: string) => {
      if (table === 'projects') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: null,
                error: duplicateInboxError(),
              })),
            })),
          })),
          select: vi.fn(() => {
            const filters: Record<string, unknown> = {};
            const query = {
              eq: vi.fn((column: string, value: unknown) => {
                filters[column] = value;
                shouldReturnInbox =
                  filters['owner_id'] === 'owner-1' &&
                  filters['is_inbox'] === true;
                return query;
              }),
              maybeSingle: vi.fn(async () => ({
                data: shouldReturnInbox ? inboxRow : null,
                error: null,
              })),
              then: (
                resolve: (value: { data: ProjectRow[]; error: null }) => unknown,
                reject: (reason?: unknown) => unknown
              ) => Promise.resolve({ data: [], error: null }).then(resolve, reject),
            };
            return query;
          }),
        };
      }
      if (table === 'project_members') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(async () => ({ data: [], error: null })),
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function duplicateInboxError(): { code: string; message: string } {
  return {
    code: '23505',
    message:
      'duplicate key value violates unique constraint "projects_owner_single_inbox_idx"',
  };
}

function legacyProjectRow(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: 'project-1',
    owner_id: 'owner-1',
    name: 'Shared project',
    description: null,
    color: null,
    icon: null,
    is_active: true,
    is_inbox: false,
    project_type: null,
    ancestor_id: null,
    task_view: null,
    default_priority: null,
    default_finish_date: null,
    default_type_finish_date: null,
    dialog_time_when_task_finished: null,
    project_members: [legacyMemberRow()],
    ...overrides,
  };
}

function legacyMemberRow(): LegacyProjectMemberRow {
  return {
    project_id: 'project-1',
    user_id: 'member-1',
    role: 'viewer',
    invited_at: '2026-01-01T00:00:00.000Z',
  };
}

function createProjectMember(
  userId: string,
  status: 'pending' | 'accepted' | 'declined' = 'accepted'
) {
  return {
    projectId: 'project-1',
    userId,
    status,
    role: 'editor',
    invitedEmail: null,
    invitedProjectName: null,
    invitedBy: null,
    invitedAt: null,
    acceptedAt: null,
    declinedAt: null,
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
