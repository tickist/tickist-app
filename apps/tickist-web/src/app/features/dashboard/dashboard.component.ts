import {
  Component,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ToastService } from '../../core/ui/toast.service';
import { TaskDataService, type Task } from '../../data/task-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Project, ProjectDataService } from '../../data/project-data.service';
import { TaskListComponent } from '../app-shell/task-list.component';
import { TaskGroupSummaryComponent } from '../../core/ui/task-group-summary.component';
import { AppViewStateService } from '../app-shell/app-view-state.service';
import { TaskStatusService } from '../../data/task-status.service';
import { TaskOccurrenceDataService } from '../../data/task-occurrence-data.service';
import { formatDay } from '../../core/time/date-format';
import { formatMinutesShort } from '../../core/time/duration';
import { IconComponent } from '../../core/ui/icon.component';
import { SimpleViewToggleComponent } from '../../core/ui/simple-view-toggle.component';
import { TaskViewPreferenceService } from '../app-shell/task-view-preference.service';
import { WorkspaceDataService } from '../../data/workspace-data.service';
import { TimeTrackingService } from '../../data/time-tracking.service';
import { DayPlanService } from '../../data/day-plan.service';
import { applyDayOrder } from '../../core/time/day-order';
import { comparePriority, compareScheduled } from '../../core/time/day-plan';
import {
  TODAY_SORT_LABELS,
  TODAY_SORT_OPTIONS,
  type TodaySort,
  isTodaySort,
  readTodaySort,
  writeTodaySort,
} from './today-sort';
import { type TaskReorder } from '../app-shell/task-list.component';
import {
  type DueDayStatus,
  dueDayStatus,
  moveToDay,
  zonedDateKey,
} from '../../core/time/zoned-time';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SlicePipe,
    RouterLink,
    TaskListComponent,
    TaskGroupSummaryComponent,
    IconComponent,
    SimpleViewToggleComponent,
  ],
})
export class DashboardComponent {
  private readonly tasks = inject(TaskDataService);
  private readonly projects = inject(ProjectDataService);
  private readonly session = inject(SupabaseSessionService);
  private readonly viewState = inject(AppViewStateService);
  private readonly taskStatus = inject(TaskStatusService);
  private readonly workspaces = inject(WorkspaceDataService);
  private readonly timeTracking = inject(TimeTrackingService);
  private readonly dayPlan = inject(DayPlanService);
  private readonly toasts = inject(ToastService);
  private readonly occurrences = inject(TaskOccurrenceDataService);
  private readonly taskViews = inject(TaskViewPreferenceService);

  /** Simple or extended cards, remembered in this browser. */
  readonly viewMode = this.taskViews.dashboard;

  readonly movingOverdue = signal(false);

  /** Order of the Today group, remembered in this browser. */
  readonly todaySort = signal<TodaySort>(readTodaySort(browserStorage()));
  readonly todaySortOptions = TODAY_SORT_OPTIONS.map((value) => ({
    value,
    label: TODAY_SORT_LABELS[value],
  }));

  readonly user = computed(() => this.session.user());
  readonly searchTerm = this.viewState.searchTerm;
  readonly projectList = computed(() =>
    this.projects
      .list()
      .filter(
        (project) =>
          project.ownerId === this.user()?.id &&
          this.workspaces.includesProject(project)
      )
  );
  readonly projectNameMap = computed(() => {
    const map = new Map<string, string>();
    this.projectList().forEach((project) => {
      map.set(project.id, project.name);
    });

    return map;
  });
  readonly projectLookup = computed(() => {
    const map = new Map<string, Project>();
    this.projectList().forEach((project) => map.set(project.id, project));

    return map;
  });
  readonly inboxProject = computed(
    () => this.projectList().find((p) => p.isInbox) ?? null
  );
  readonly taskList = computed(() => {
    const normalizedSearch = this.searchTerm().trim().toLowerCase();

    return this.tasks.list().filter((task) => {
      if (
        task.ownerId !== this.user()?.id ||
        task.onHold ||
        this.taskStatus.isSuspended(task) ||
        !this.workspaces.includesTask(task, this.projects.list())
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        task.name.toLowerCase().includes(normalizedSearch) ||
        (task.description ?? '').toLowerCase().includes(normalizedSearch)
      );
    });
  });
  /** Tasks due today plus pinned tasks, which always belong to today. */
  readonly todayTasks = computed(() => {
    const due = this.tasksDue('today');
    const dueIds = new Set(due.map((task) => task.id));

    return [
      ...due,
      ...this.pinnedTasks().filter((task) => !dueIds.has(task.id)),
    ];
  });
  /** Overdue tasks; pinned ones are already listed under Today. */
  readonly overdueTasks = computed(() =>
    this.tasksDue('overdue').filter((task) => !task.pinned)
  );
  /** Tasks completed today in the account timezone, newest first. */
  readonly doneTodayTasks = computed(() => {
    const timezone = this.timeTracking.timezone();
    const todayKey = zonedDateKey(new Date(), timezone);

    return this.taskList()
      .filter(
        (task) =>
          task.isDone &&
          !!task.whenComplete &&
          zonedDateKey(new Date(task.whenComplete), timezone) === todayKey
      )
      .sort((a, b) =>
        (b.whenComplete ?? '').localeCompare(a.whenComplete ?? '')
      );
  });
  /**
   * Recurring tasks completed today. The task itself is open again with its
   * next date, so each completed occurrence is listed separately.
   */
  readonly doneTodayOccurrences = computed(() => {
    const timezone = this.timeTracking.timezone();
    const todayKey = zonedDateKey(new Date(), timezone);
    const tasksById = new Map(this.taskList().map((task) => [task.id, task]));

    return this.occurrences.recent().flatMap((completion) => {
      const task = tasksById.get(completion.taskId);

      if (
        !task ||
        zonedDateKey(new Date(completion.completedAt), timezone) !== todayKey
      )
        return [];

      const project = this.projectOf(task.projectId);

      return [
        {
          id: completion.id,
          name: task.name,
          projectName: project?.name ?? '',
          nextDate: formatDay(task.finishDate, { timeZone: timezone }),
          spent:
            completion.spentMinutes && completion.spentMinutes > 0
              ? formatMinutesShort(completion.spentMinutes)
              : null,
          // Summary input: the task's estimate and this occurrence's time.
          estimateMinutes: task.estimateMinutes ?? null,
          spentMinutes: completion.spentMinutes,
        },
      ];
    });
  });
  /** Everything completed today, for the group heading summary. */
  readonly doneTodaySummary = computed(() => [
    ...this.doneTodayTasks(),
    ...this.doneTodayOccurrences(),
  ]);
  readonly nextActionTasks = computed(() =>
    this.taskList().filter(
      (task) => task.taskType === 'next_action' && !task.isDone
    )
  );
  readonly needInfoTasks = computed(() =>
    this.taskList().filter(
      (task) => task.taskType === 'need_info' && !task.isDone
    )
  );
  readonly projectTaskCounts = computed(() => {
    const counts = new Map<string, number>();
    this.taskList().forEach((task) => {
      if (task.projectId) {
        counts.set(task.projectId, (counts.get(task.projectId) ?? 0) + 1);
      }
    });

    return counts;
  });
  readonly projectsMissingNextAction = computed(() => {
    const nextActionProjects = new Set(
      this.taskList().flatMap((task) =>
        task.taskType === 'next_action' && !task.isDone && task.projectId
          ? [task.projectId]
          : []
      )
    );

    return this.projectList()
      .filter((project) => project.isActive && !project.isInbox)
      .filter((project) => !nextActionProjects.has(project.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
  /**
   * Today by the chosen order. My order follows the day plan shared with
   * Weekdays → Today; tasks outside the plan follow by time and priority.
   */
  readonly sortedTodayTasks = computed(() => {
    const tasks = this.todayTasks();

    switch (this.todaySort()) {
      case 'priority':
        return [...tasks].sort(comparePriority);
      case 'manual':
        return applyDayOrder(
          tasks,
          this.dayPlan.orderFor(this.dayPlan.todayKey()),
          compareScheduled
        );
      default:
        return [...tasks].sort(compareScheduled);
    }
  });
  readonly sortedOverdueTasks = computed(() =>
    [...this.overdueTasks()].sort((a, b) => {
      const dateA = a.finishDate ?? '';
      const dateB = b.finishDate ?? '';

      return dateB.localeCompare(dateA);
    })
  );
  readonly projectForTaskList = (task: Task): Project | null =>
    this.projectOf(task.projectId);

  private readonly pinnedTasks = computed(() =>
    this.taskList().filter((task) => task.pinned && !task.isDone)
  );

  private tasksDue(status: DueDayStatus): Task[] {
    const now = new Date();
    const timezone = this.timeTracking.timezone();

    return this.taskList().filter(
      (task) =>
        !task.isDone &&
        !!task.finishDate &&
        dueDayStatus(task.finishDate, now, timezone) === status
    );
  }

  /** Empty-Today next step: plan overdue work for today, keeping times. */
  async moveOverdueToToday(): Promise<void> {
    const timezone = this.timeTracking.timezone();
    const todayKey = zonedDateKey(new Date(), timezone);

    const updates = this.overdueTasks().flatMap((task) => {
      const finishDate =
        task.finishDate && moveToDay(task.finishDate, todayKey, timezone);

      return finishDate ? [{ id: task.id, finishDate }] : [];
    });

    if (!updates.length || this.movingOverdue()) {
      return;
    }

    this.movingOverdue.set(true);

    try {
      const results = await Promise.all(
        updates.map((update) => this.tasks.updateTask(update))
      );

      const moved = results.filter(Boolean).length;

      if (moved === updates.length) {
        this.toasts.success(
          moved === 1
            ? 'Moved 1 task to today.'
            : `Moved ${moved} tasks to today.`
        );
      } else {
        this.toasts.error(
          `Moved ${moved} of ${updates.length} tasks. Try again for the rest.`
        );
      }
    } finally {
      this.movingOverdue.set(false);
    }
  }

  setSimpleView(simple: boolean): void {
    this.taskViews.setSimple('dashboard', simple);
  }

  setTodaySort(value: string): void {
    if (!isTodaySort(value)) return;

    this.todaySort.set(value);
    writeTodaySort(browserStorage(), value);
  }

  /** Dragging a card keeps the list as shown and switches to My order. */
  reorderToday(reorder: TaskReorder): void {
    this.setTodaySort('manual');
    this.dayPlan.move(
      this.dayPlan.todayKey(),
      reorder.ids,
      reorder.from,
      reorder.to
    );
  }

  projectTaskCount(projectId: string): number {
    return this.projectTaskCounts().get(projectId) ?? 0;
  }

  projectName(projectId: string | null): string {
    if (!projectId) return 'Inbox';

    return this.projectNameMap().get(projectId) ?? 'Inbox';
  }

  projectOf(projectId: string | null): Project | null {
    if (!projectId) return this.inboxProject();

    return this.projectLookup().get(projectId) ?? this.inboxProject();
  }

  trackTask(_index: number, task: Task): string {
    return task.id;
  }
}

function browserStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
