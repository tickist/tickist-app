import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ProjectDataService } from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { TaskDataService } from '../../data/task-data.service';
import { TimeReportGrouping, buildTimeReport } from '../../data/time-report';
import {
  TimeReportRow,
  TimeTrackingService,
  formatDuration,
} from '../../data/time-tracking.service';
import {
  ReportPeriod,
  periodLabel,
  periodRange,
  shiftPeriod,
} from '../../core/time/zoned-time';

const PERIOD_NOUN: Record<ReportPeriod, string> = {
  day: 'day',
  week: 'week',
  month: 'month',
};

@Component({
  selector: 'app-time-report',
  standalone: true,
  templateUrl: './time-report.component.html',
  styleUrl: './time-report.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeReportComponent {
  private readonly timer = inject(TimeTrackingService);
  private readonly tasks = inject(TaskDataService);
  private readonly projects = inject(ProjectDataService);
  private readonly tags = inject(TagDataService);

  /** Any date inside the shown period; the date picker edits it. */
  readonly day = signal(this.timer.todayKey());
  readonly period = signal<ReportPeriod>('day');
  readonly grouping = signal<TimeReportGrouping>('project');
  readonly loading = signal(false);
  private readonly rows = signal<TimeReportRow[]>([]);
  private requestSequence = 0;

  readonly report = computed(() =>
    buildTimeReport(
      this.rows(),
      this.tasks.list(),
      this.projects.list(),
      this.tags.list(),
      this.grouping()
    )
  );
  readonly range = computed(() => periodRange(this.day(), this.period()));
  readonly rangeLabel = computed(() =>
    this.period() === 'day' ? null : periodLabel(this.range(), this.period())
  );
  /** The shown period already contains today, so there is nothing later. */
  readonly isCurrent = computed(() => this.range().to >= this.timer.todayKey());
  readonly periodNoun = computed(() => PERIOD_NOUN[this.period()]);
  readonly emptyLabel = computed(() =>
    this.period() === 'day'
      ? 'No time recorded on this day.'
      : `No time recorded in this ${this.periodNoun()}.`
  );
  readonly currentLabel = computed(() =>
    this.period() === 'day' ? 'Today' : `This ${this.periodNoun()}`
  );

  readonly format = formatDuration;
  readonly periods: readonly { value: ReportPeriod; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];

  constructor() {
    effect(() => {
      const { from, to } = this.range();

      // The running timer stops or starts: refresh so today's numbers move.
      this.timer.running();
      untracked(() => {
        void this.load(from, to);
      });
    });
  }

  previous(): void {
    this.day.set(shiftPeriod(this.day(), this.period(), -1));
  }

  next(): void {
    if (this.isCurrent()) return;

    const today = this.timer.todayKey();
    const next = shiftPeriod(this.day(), this.period(), 1);

    this.day.set(next > today ? today : next);
  }

  setPeriod(period: ReportPeriod): void {
    this.period.set(period);
  }

  today(): void {
    this.day.set(this.timer.todayKey());
  }

  onDateInput(event: Event): void {
    const target = event.target;

    if (
      target instanceof HTMLInputElement &&
      /^\d{4}-\d{2}-\d{2}$/.test(target.value)
    ) {
      this.day.set(target.value);
    }
  }

  setGrouping(grouping: TimeReportGrouping): void {
    this.grouping.set(grouping);
  }

  private async load(from: string, to: string): Promise<void> {
    const sequence = ++this.requestSequence;

    this.loading.set(true);
    const rows = await this.timer.report(from, to);

    if (sequence !== this.requestSequence) return;
    this.rows.set(rows);
    this.loading.set(false);
  }
}
