import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectDataService } from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { Task, TaskDataService } from '../../data/task-data.service';
import { TimeTrackingService } from '../../data/time-tracking.service';
import { TimeReportComponent } from './time-report.component';

const TODAY = '2026-11-06';

// SAFETY: the report and the entries editor read only these task fields.
const task = {
  id: 't1',
  name: 'Homepage',
  projectId: null,
  tags: [],
  spentMinutes: 40,
} as Task;

describe('TimeReportComponent', () => {
  const report = vi.fn();
  const listTaskEntries = vi.fn();
  const createEntry = vi.fn();

  async function render() {
    TestBed.configureTestingModule({
      imports: [TimeReportComponent],
      providers: [
        {
          provide: TimeTrackingService,
          useValue: {
            todayKey: () => TODAY,
            timezone: () => 'UTC',
            running: signal(null),
            report,
            listTaskEntries,
            createEntry,
            updateEntry: vi.fn(),
            deleteEntry: vi.fn(),
          },
        },
        { provide: TaskDataService, useValue: { list: () => [task] } },
        { provide: ProjectDataService, useValue: { list: () => [] } },
        { provide: TagDataService, useValue: { list: () => [] } },
      ],
    });

    const fixture = TestBed.createComponent(TimeReportComponent);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  }

  beforeEach(() => {
    report.mockReset().mockResolvedValue([
      {
        workDate: TODAY,
        taskId: 't1',
        mySeconds: 2400,
        everyoneSeconds: 2400,
      },
    ]);
    listTaskEntries.mockReset().mockResolvedValue([]);
    createEntry.mockReset().mockResolvedValue(true);
  });

  it('opens the entries editor under a task and closes it again', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    const toggle = element.querySelector<HTMLButtonElement>(
      '[data-testid="time-report-task"]'
    );

    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    toggle?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('app-task-time-entries')).not.toBeNull();
    expect(listTaskEntries).toHaveBeenCalledWith('t1');

    toggle?.click();
    fixture.detectChanges();

    expect(element.querySelector('app-task-time-entries')).toBeNull();
  });

  it('starts new entries on the shown day', async () => {
    const fixture = await render();

    fixture.componentInstance.day.set('2026-11-02');
    expect(fixture.componentInstance.entryDate()).toBe('2026-11-02');

    fixture.componentInstance.setPeriod('week');
    expect(fixture.componentInstance.entryDate()).toBe(TODAY);

    fixture.componentInstance.day.set('2026-10-20');
    expect(fixture.componentInstance.entryDate()).toBe('2026-10-19');
  });

  it('reloads the period after an entry changes', async () => {
    const fixture = await render();

    report.mockClear();
    fixture.componentInstance.entriesChanged();

    expect(report).toHaveBeenCalledWith(TODAY, TODAY);
  });
});
