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
import { TaskTimeEntriesComponent } from '../task-fab/task-time-entries.component';
import {
  TimeReportRow,
  TimeTrackingService,
  formatDuration,
} from '../../data/time-tracking.service';
import {
  ReportPeriod,
  dateKeysInRange,
  periodLabel,
  periodRange,
  shiftPeriod,
  weekdayLabel,
} from '../../core/time/zoned-time';

const PERIOD_NOUN: Record<ReportPeriod, string> = {
  day: 'day',
  week: 'week',
  month: 'month',
};

@Component({
  selector: 'app-time-report',
  standalone: true,
  imports: [TaskTimeEntriesComponent],
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
  /** Group key and task id of the row whose entries are open for editing. */
  readonly expanded = signal<string | null>(null);
  private readonly rows = signal<TimeReportRow[]>([]);
  private requestSequence = 0;

  readonly range = computed(() => periodRange(this.day(), this.period()));
  /** The week view adds one column per day. */
  readonly days = computed(() =>
    this.period() === 'week'
      ? dateKeysInRange(this.range()).map((key) => ({
          key,
          label: weekdayLabel(key),
        }))
      : []
  );
  readonly report = computed(() =>
    buildTimeReport(
      this.rows(),
      this.tasks.list(),
      this.projects.list(),
      this.tags.list(),
      this.grouping(),
      this.days().map((day) => day.key)
    )
  );
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

  /** Task, day columns and one or two total columns. */
  readonly columnCount = computed(
    () => 1 + this.days().length + (this.report().hasOthers ? 2 : 1)
  );
  /** New entries start on the shown day, or today when it is in the period. */
  readonly entryDate = computed(() => {
    const { from, to } = this.range();
    const today = this.timer.todayKey();

    if (this.period() === 'day') return this.day();

    return today >= from && today <= to ? today : from;
  });

  readonly format = formatDuration;

  /** Day cells stay quiet when nothing was logged. */
  formatDay(seconds: number): string {
    return seconds > 0 ? formatDuration(seconds) : '–';
  }

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

  rowKey(groupKey: string, taskId: string): string {
    return `${groupKey}|${taskId}`;
  }

  toggle(key: string): void {
    this.expanded.update((current) => (current === key ? null : key));
  }

  /** Entries changed in the inline editor: reload the shown period. */
  entriesChanged(): void {
    const { from, to } = this.range();

    void this.load(from, to);
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
