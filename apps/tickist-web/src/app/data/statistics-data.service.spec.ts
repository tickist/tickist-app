import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { StatisticsDataService } from './statistics-data.service';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';

describe('StatisticsDataService', () => {
  const rpcMock = vi.fn();

  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('calls the statistics RPC with the default window and normalizes groups', async () => {
    rpcMock.mockResolvedValue({
      data: {
        windowDays: 30,
        summary: {
          completedCount: 12,
          completedLateCount: 3,
          openOverdueCount: 4,
          inactiveProjectsCount: 1,
        },
        groups: [
          {
            key: 'active',
            label: 'Active',
            inactiveProjects: [
              {
                projectId: 'project-1',
                name: 'Dormant roadmap',
                color: '#112233',
                icon: 'folder',
                projectType: 'active',
                staleDays: 41,
                lastActivityAt: '2026-01-10T12:00:00.000Z',
                openTasks: 5,
                overdueOpenTasks: 2,
              },
            ],
          },
        ],
      },
      error: null,
    });

    TestBed.configureTestingModule({
      providers: [
        StatisticsDataService,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            rpc: rpcMock,
          },
        },
        {
          provide: SupabaseSessionService,
          useValue: {
            user: signal(null as User | null).asReadonly(),
          },
        },
      ],
    });

    const service = TestBed.inject(StatisticsDataService);
    await service.refresh();

    expect(rpcMock).toHaveBeenCalledWith('get_statistics_overview', {
      window_days: 30,
    });
    expect(service.error()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.overview().summary.completedCount).toBe(12);
    expect(service.overview().groups[0].inactiveProjects[0]?.projectId).toBe(
      'project-1'
    );
    expect(service.overview().groups[1].inactiveProjects).toEqual([]);
    expect(service.overview().groups[2].inactiveProjects).toEqual([]);
  });

  it('exposes a friendly error and keeps an empty overview when the RPC fails', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    });

    TestBed.configureTestingModule({
      providers: [
        StatisticsDataService,
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            rpc: rpcMock,
          },
        },
        {
          provide: SupabaseSessionService,
          useValue: {
            user: signal(null as User | null).asReadonly(),
          },
        },
      ],
    });

    const service = TestBed.inject(StatisticsDataService);
    await service.refresh();

    expect(service.error()).toContain('Unable to load statistics');
    expect(service.overview().summary.inactiveProjectsCount).toBe(0);
    expect(
      service.overview().groups.every((group) => !group.inactiveProjects.length)
    ).toBe(true);
  });
});
