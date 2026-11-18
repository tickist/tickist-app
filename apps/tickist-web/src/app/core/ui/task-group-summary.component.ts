import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { formatMinutesShort } from '../time/duration';

/** Minimal task shape the summary needs. */
export interface SummarizedTask {
  estimateMinutes?: number | null;
  spentMinutes?: number | null;
}

export interface TaskGroupTotals {
  count: number;
  estimateMinutes: number;
  spentMinutes: number;
}

/** Count, total estimate and total time spent of a group of tasks. */
export function summarizeTasks(
  tasks: readonly SummarizedTask[]
): TaskGroupTotals {
  return tasks.reduce<TaskGroupTotals>(
    (total, task) => ({
      count: total.count + 1,
      estimateMinutes: total.estimateMinutes + (task.estimateMinutes ?? 0),
      spentMinutes: total.spentMinutes + (task.spentMinutes ?? 0),
    }),
    { count: 0, estimateMinutes: 0, spentMinutes: 0 }
  );
}

/**
 * Compact header summary of a task group: "3 tasks · 2h est. · 45m spent".
 * Estimate and spent time appear only when they are above zero.
 */
@Component({
  selector: 'app-task-group-summary',
  standalone: true,
  template: `
    <span class="task-group-summary" data-testid="task-group-summary">
      @for (part of parts(); track part.testId; let first = $first) { @if
      (!first) {
      <span class="sr-only">, </span>
      <span class="task-group-summary__sep" aria-hidden="true">·</span>
      }
      <span [attr.data-testid]="part.testId" [attr.title]="part.title">{{
        part.text
      }}</span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .task-group-summary {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0 0.4rem;
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: normal;
      text-transform: none;
      color: rgb(var(--bc) / 0.6);
      font-variant-numeric: tabular-nums;
    }

    .task-group-summary__sep {
      opacity: 0.6;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskGroupSummaryComponent {
  readonly tasks = input.required<readonly SummarizedTask[]>();
  /** Hide the count when the header already shows it, e.g. in a badge. */
  readonly showCount = input(true);

  readonly totals = computed(() => summarizeTasks(this.tasks()));
  readonly parts = computed(() => {
    const { count, estimateMinutes, spentMinutes } = this.totals();
    const parts: { testId: string; text: string; title: string | null }[] = [];

    if (this.showCount()) {
      parts.push({
        testId: 'task-group-count',
        text: count === 1 ? '1 task' : `${count} tasks`,
        title: null,
      });
    }

    if (estimateMinutes > 0) {
      const estimate = formatMinutesShort(estimateMinutes);
      parts.push({
        testId: 'task-group-estimate',
        text: `${estimate} est.`,
        title: `Estimated: ${estimate}`,
      });
    }

    if (spentMinutes > 0) {
      const spent = formatMinutesShort(spentMinutes);
      parts.push({
        testId: 'task-group-spent',
        text: `${spent} spent`,
        title: `Time spent: ${spent}`,
      });
    }

    return parts;
  });
}
