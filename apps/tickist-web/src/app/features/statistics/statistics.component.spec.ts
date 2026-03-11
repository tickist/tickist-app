import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEmptyStatsOverview,
  type StatsOverview,
  StatisticsDataService,
} from '../../data/statistics-data.service';
import { StatisticsComponent } from './statistics.component';

describe('StatisticsComponent', () => {
  let fixture: ComponentFixture<StatisticsComponent>;
  const overviewState = signal<StatsOverview>(createEmptyStatsOverview());
  const loadingState = signal(false);
  const errorState = signal<string | null>(null);
  const refreshMock = vi.fn(async () => undefined);
  const activateMock = vi.fn();
  const deactivateMock = vi.fn();

  beforeEach(async () => {
    overviewState.set(createEmptyStatsOverview());
    loadingState.set(false);
    errorState.set(null);
    refreshMock.mockClear();
    activateMock.mockClear();
    deactivateMock.mockClear();

    await TestBed.configureTestingModule({
      imports: [StatisticsComponent],
      providers: [
        provideRouter([]),
        {
          provide: StatisticsDataService,
          useValue: {
            overview: overviewState.asReadonly(),
            loading: loadingState.asReadonly(),
            error: errorState.asReadonly(),
            activate: activateMock,
            deactivate: deactivateMock,
            refresh: refreshMock,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatisticsComponent);
  });

  it('shows a loading state while statistics are being fetched', () => {
    loadingState.set(true);
    fixture.detectChanges();

    const loading = fixture.nativeElement.querySelector(
      '[data-testid="statistics-loading"]'
    ) as HTMLElement | null;

    expect(loading?.textContent).toContain('Loading');
  });

  it('activates on init and deactivates on destroy', () => {
    fixture.detectChanges();
    fixture.destroy();

    expect(activateMock).toHaveBeenCalledTimes(1);
    expect(deactivateMock).toHaveBeenCalledTimes(1);
  });

  it('renders KPI cards and inactive project links from the overview', () => {
    overviewState.set({
      windowDays: 30,
      summary: {
        completedCount: 8,
        completedLateCount: 2,
        openOverdueCount: 3,
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
              staleDays: 45,
              lastActivityAt: '2026-01-10T12:00:00.000Z',
              openTasks: 6,
              overdueOpenTasks: 2,
            },
          ],
        },
        {
          key: 'someday',
          label: 'Someday / Maybe',
          inactiveProjects: [],
        },
        {
          key: 'routine',
          label: 'Routine',
          inactiveProjects: [],
        },
      ],
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const completedCard = compiled.querySelector(
      '[data-testid="statistics-card-completed"]'
    ) as HTMLElement | null;
    const link = compiled.querySelector(
      '[data-testid="statistics-group-active"] a'
    ) as HTMLAnchorElement | null;

    expect(completedCard?.textContent).toContain('8');
    expect(compiled.textContent).toContain('Dormant roadmap');
    expect(compiled.textContent).toContain('45 days inactive');
    expect(link?.getAttribute('href')).toContain('/app/tasks/project-1');
  });

  it('shows empty states for groups without inactive projects', () => {
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector(
      '[data-testid="statistics-empty-someday"]'
    ) as HTMLElement | null;

    expect(empty?.textContent).toContain('No inactive projects in this group.');
  });
});
