import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { ProjectDataService } from '../../data/project-data.service';
import { TaskDataService } from '../../data/task-data.service';
import {
  TimeTrackingService,
  formatClock,
  formatDuration,
} from '../../data/time-tracking.service';
import { AppViewStateService } from '../app-shell/app-view-state.service';

@Component({
  selector: 'app-focus',
  standalone: true,
  templateUrl: './focus.component.html',
  styleUrl: './focus.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusComponent {
  readonly timer = inject(TimeTrackingService);
  private readonly tasks = inject(TaskDataService);
  private readonly projects = inject(ProjectDataService);
  private readonly router = inject(Router);
  private readonly viewState = inject(AppViewStateService);
  readonly taskId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((params) => params.get('taskId') ?? '')
    ),
    { initialValue: '' }
  );

  private readonly todaySecondsBefore = signal(0);

  readonly task = computed(() =>
    this.tasks.list().find((item) => item.id === this.taskId())
  );
  readonly projectName = computed(() => {
    const projectId = this.task()?.projectId;

    return projectId
      ? this.projects.list().find((project) => project.id === projectId)
          ?.name ?? ''
      : '';
  });
  readonly isRunning = computed(() => this.timer.isRunningTask(this.taskId()));
  readonly clock = computed(() =>
    formatClock(this.isRunning() ? this.timer.elapsedSeconds() : 0)
  );
  readonly overLimit = computed(
    () => this.isRunning() && this.timer.limitReached()
  );
  readonly limitLabel = computed(() => {
    const limit = this.isRunning()
      ? this.timer.running()?.limitMinutes
      : this.timer.focusLimitMinutes();

    return limit ? `Limit ${limit} min` : 'No limit';
  });
  readonly progressPercent = computed(() => {
    const limit = this.timer.running()?.limitMinutes;

    if (!this.isRunning() || !limit) return null;

    return Math.min(
      100,
      Math.round((this.timer.elapsedSeconds() / (limit * 60)) * 100)
    );
  });
  readonly todayLabel = computed(() =>
    formatDuration(
      this.todaySecondsBefore() +
        (this.isRunning() ? this.timer.elapsedSeconds() : 0)
    )
  );

  constructor() {
    effect(() => {
      // Reload today's closed time whenever the task or timer state changes.
      this.taskId();
      this.isRunning();
      untracked(() => {
        void this.loadTodayBefore();
      });
    });
  }

  async pause(): Promise<void> {
    await this.timer.stop();
  }

  async resume(): Promise<void> {
    await this.timer.start(this.taskId());
  }

  async finish(): Promise<void> {
    if (this.isRunning() && !(await this.timer.stop())) return;
    await this.leave();
  }

  async leave(): Promise<void> {
    await this.router.navigateByUrl(
      this.viewState.lastNonSheetAppUrl() ?? '/app'
    );
  }

  /** Today's time on this task, excluding the running entry. */
  private async loadTodayBefore(): Promise<void> {
    const today = this.timer.todayKey();
    const rows = await this.timer.report(today);

    const mine = rows
      .filter((row) => row.taskId === this.taskId())
      .reduce((sum, row) => sum + row.mySeconds, 0);

    const running = this.isRunning() ? this.timer.elapsedSeconds() : 0;

    this.todaySecondsBefore.set(Math.max(0, mine - running));
  }
}
