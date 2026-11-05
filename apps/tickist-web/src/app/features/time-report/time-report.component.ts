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
import { shiftDateKey } from '../../core/time/zoned-time';

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

  readonly day = signal(this.timer.todayKey());
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
  readonly isToday = computed(() => this.day() === this.timer.todayKey());

  readonly format = formatDuration;

  constructor() {
    effect(() => {
      const day = this.day();

      // The running timer stops or starts: refresh so today's numbers move.
      this.timer.running();
      untracked(() => {
        void this.load(day);
      });
    });
  }

  previousDay(): void {
    this.day.set(shiftDateKey(this.day(), -1));
  }

  nextDay(): void {
    if (!this.isToday()) this.day.set(shiftDateKey(this.day(), 1));
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

  private async load(day: string): Promise<void> {
    const sequence = ++this.requestSequence;

    this.loading.set(true);
    const rows = await this.timer.report(day);

    if (sequence !== this.requestSequence) return;
    this.rows.set(rows);
    this.loading.set(false);
  }
}
