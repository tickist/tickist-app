import { fixtureHost } from '../../../testing/dom';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  summarizeTasks,
  TaskGroupSummaryComponent,
  type SummarizedTask,
} from './task-group-summary.component';

describe('summarizeTasks', () => {
  it('counts tasks and sums estimate and spent time, ignoring missing values', () => {
    expect(
      summarizeTasks([
        { estimateMinutes: 30, spentMinutes: 10 },
        { estimateMinutes: null, spentMinutes: 5 },
        {},
      ])
    ).toEqual({ count: 3, estimateMinutes: 30, spentMinutes: 15 });
  });
});

describe('TaskGroupSummaryComponent', () => {
  function render(tasks: SummarizedTask[], showCount = true): HTMLElement {
    const fixture = TestBed.createComponent(TaskGroupSummaryComponent);
    fixture.componentRef.setInput('tasks', tasks);
    fixture.componentRef.setInput('showCount', showCount);
    fixture.detectChanges();

    return fixtureHost(fixture);
  }

  it('shows the count, estimate and spent time', () => {
    const host = render([
      { estimateMinutes: 90, spentMinutes: 20 },
      { estimateMinutes: 60, spentMinutes: 25 },
    ]);

    // Screen readers get commas; the middle dots are decorative.
    expect(host.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '2 tasks, ·2h 30m est., ·45m spent'
    );
  });

  it('shows only the count when nothing is estimated or logged', () => {
    const host = render([{}]);

    expect(host.textContent?.trim()).toBe('1 task');
    expect(
      host.querySelector('[data-testid="task-group-estimate"]')
    ).toBeNull();
    expect(host.querySelector('[data-testid="task-group-spent"]')).toBeNull();
  });

  it('can hide the count', () => {
    const host = render([{ estimateMinutes: 15 }], false);

    expect(host.querySelector('[data-testid="task-group-count"]')).toBeNull();
    expect(host.textContent?.trim()).toBe('15m est.');
  });
});
