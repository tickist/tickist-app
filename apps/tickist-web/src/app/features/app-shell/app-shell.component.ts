import {
  Component,
  computed,
  effect,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { formatDayKeyLong, formatMonthKey } from '../../core/time/date-format';
import { TaskGroupSummaryComponent } from '../../core/ui/task-group-summary.component';

import {
  Task,
  TaskDataService,
  TaskCreateInput,
} from '../../data/task-data.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Project,
  ProjectDataService,
  defaultTaskAssigneeIds,
} from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AppViewStateService } from './app-view-state.service';
import { TaskListComponent } from './task-list.component';
import { ProjectHeaderComponent } from './project-header.component';
import { ToastService } from '../../core/ui/toast.service';
import { ComposerModalService } from '../task-fab/composer-modal.service';
import {
  buildProjectTaskScope,
  taskMatchesProjectScope,
} from './project-task-scope';
import { TaskStatusService } from '../../data/task-status.service';
import { WorkspaceDataService } from '../../data/workspace-data.service';
import { TimeTrackingService } from '../../data/time-tracking.service';
import { DayPlanService } from '../../data/day-plan.service';
import { applyDayOrder } from '../../core/time/day-order';
import {
  compareDeadlines,
  compareScheduled,
  deadlinesForDay,
  pinnedForToday,
  scheduledForDay,
  taskDayKey,
} from '../../core/time/day-plan';
import { zonedDateKey } from '../../core/time/zoned-time';
import { type TaskReorder } from './task-list.component';
import {
  DEFAULT_PROJECT_SORT,
  type ProjectSortOption,
  type ProjectSorts,
  readProjectSorts,
  writeProjectSorts,
} from './project-sort';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TaskListComponent,
    ProjectHeaderComponent,
    TaskGroupSummaryComponent,
  ],
  templateUrl: './app-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  private readonly session = inject(SupabaseSessionService);
  private readonly tasksService = inject(TaskDataService);
  private readonly projectsService = inject(ProjectDataService);
  private readonly tagsService = inject(TagDataService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewState = inject(AppViewStateService);
  private readonly toasts = inject(ToastService);
  private readonly composer = inject(ComposerModalService);
  private readonly taskStatus = inject(TaskStatusService);
  private readonly workspaces = inject(WorkspaceDataService);
  private readonly timeTracking = inject(TimeTrackingService);
  private readonly dayPlan = inject(DayPlanService);

  readonly user = computed(() => this.session.user());
  readonly taskList = computed(() => this.tasksService.list());
  readonly loading = this.tasksService.loadingSignal;
  readonly projectList = computed(() => this.projectsService.list());
  readonly inboxProjectId = computed(
    () => this.projectList().find((project) => project.isInbox)?.id ?? null
  );
  readonly tagList = computed(() => this.tagsService.list());
  readonly loadingProjects = this.projectsService.loadingSignal;
  readonly loadingTags = this.tagsService.loadingSignal;
  readonly selectedProjectId = this.viewState.selectedProjectId;
  readonly includedProjectIds = computed(() =>
    buildProjectTaskScope(
      this.projectList(),
      this.selectedProjectId(),
      this.viewState.excludedProjectIds()
    )
  );
  readonly selectedTaskId = signal<string | null>(null);
  readonly searchTerm = this.viewState.searchTerm;
  readonly dueDateFilter = this.viewState.dueDateFilter;
  readonly activeProject = computed(() => {
    const projectId = this.selectedProjectId();

    if (!projectId) {
      return null;
    }

    return (
      this.projectList().find((project) => project.id === projectId) ?? null
    );
  });
  readonly projectLookup = computed(() => {
    const map = new Map<string, Project>();
    this.projectList().forEach((project) => map.set(project.id, project));

    return map;
  });
  readonly dueDateLabel = computed(() => {
    const filter = this.dueDateFilter();

    if (!filter) {
      return null;
    }

    if (filter.mode === 'day') {
      return formatDayKeyLong(filter.dateKey) ?? filter.dateKey;
    }

    return formatMonthKey(filter.monthKey) ?? filter.monthKey;
  });
  readonly taskViewMode = computed(() =>
    this.activeProject()?.taskView === 'simple' ? 'simple' : 'extended'
  );
  readonly projectTaskForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
  });
  readonly projectScopedTasks = computed(() => {
    const projectId = this.selectedProjectId();
    const inboxId = this.inboxProjectId();
    const includedProjectIds = this.includedProjectIds();

    return this.taskList().filter(
      (task) =>
        taskMatchesProjectScope(task, projectId, inboxId, includedProjectIds) &&
        this.workspaces.includesTask(task, this.projectList())
    );
  });
  readonly suspendedTaskCount = computed(
    () =>
      this.projectScopedTasks().filter(
        (task) => !task.isDone && this.taskStatus.isSuspended(task)
      ).length
  );
  /** Spent and estimated minutes of every task in the project scope. */
  readonly projectTime = computed(() =>
    this.projectScopedTasks().reduce(
      (total, task) => ({
        spent: total.spent + (task.spentMinutes ?? 0),
        estimate: total.estimate + (task.estimateMinutes ?? 0),
      }),
      { spent: 0, estimate: 0 }
    )
  );
  /** Project scope, search and the done/not-done filter, without dates. */
  private readonly searchedTasks = computed(() => {
    const normalizedSearch = this.searchTerm().trim().toLowerCase();

    return this.projectScopedTasks().filter((task) => {
      const matchesSearch = normalizedSearch
        ? task.name.toLowerCase().includes(normalizedSearch) ||
          (task.description ?? '').toLowerCase().includes(normalizedSearch)
        : true;

      return (
        matchesSearch &&
        this.taskStatus.matchesFilter(task, this.filterOption())
      );
    });
  });
  readonly filteredTasks = computed(() => {
    const dueFilter = this.dueDateFilter();
    const timezone = this.timeTracking.timezone();

    // Day and month filters compare calendar days in the account timezone.
    const filtered = this.searchedTasks().filter((task) => {
      if (!dueFilter) return true;

      const dayKey = taskDayKey(task, timezone);

      if (!dayKey) return false;

      return dueFilter.mode === 'day'
        ? dayKey === dueFilter.dateKey
        : dayKey.startsWith(`${dueFilter.monthKey}-`);
    });

    return this.sortTasks(filtered);
  });
  /** Selected day (YYYY-MM-DD) when the Weekdays day view is open. */
  readonly selectedDayKey = computed(() => {
    const filter = this.dueDateFilter();

    return filter?.mode === 'day' ? filter.dateKey : null;
  });
  /** The selected day is today in the account timezone. */
  readonly selectedDayIsToday = computed(
    () =>
      this.selectedDayKey() ===
      zonedDateKey(new Date(), this.timeTracking.timezone())
  );
  /**
   * Tasks scheduled on the selected day, plus pinned tasks when it is today,
   * in the day plan order.
   */
  readonly dayScheduledTasks = computed(() => {
    const dayKey = this.selectedDayKey();

    if (!dayKey) return [];

    const timezone = this.timeTracking.timezone();
    const tasks = this.searchedTasks();

    return applyDayOrder(
      [
        ...scheduledForDay(tasks, dayKey, timezone),
        ...(this.selectedDayIsToday()
          ? pinnedForToday(tasks, dayKey, timezone)
          : []),
      ],
      this.dayPlan.orderFor(dayKey),
      compareScheduled
    );
  });
  /** Deadlines due on the selected day. */
  readonly dayDeadlineTasks = computed(() => {
    const dayKey = this.selectedDayKey();

    if (!dayKey) return [];

    return applyDayOrder(
      deadlinesForDay(
        this.searchedTasks(),
        dayKey,
        this.timeTracking.timezone()
      ),
      this.dayPlan.orderFor(dayKey),
      compareDeadlines
    );
  });
  /** Every task shown in the day or month view, for the header summary. */
  readonly dayViewTasks = computed(() =>
    this.selectedDayKey()
      ? [...this.dayScheduledTasks(), ...this.dayDeadlineTasks()]
      : this.filteredTasks()
  );
  readonly dayHasCustomOrder = computed(() => {
    const dayKey = this.selectedDayKey();

    return dayKey ? this.dayPlan.hasOrder(dayKey) : false;
  });
  readonly filteredStats = computed(() => {
    const tasks = this.filteredTasks();
    const now = new Date();

    return {
      open: tasks.filter((task) => !task.isDone).length,
      done: tasks.filter((task) => task.isDone).length,
      overdue: tasks.filter(
        (task) =>
          !task.isDone && !!task.finishDate && new Date(task.finishDate) < now
      ).length,
      pinned: tasks.filter((task) => task.pinned).length,
    };
  });
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    estimateMinutes: this.fb.control<number | null>(null, [Validators.min(0)]),
    projectId: [''],
  });
  readonly taskEditForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    estimateMinutes: [0, [Validators.min(0)]],
    projectId: [''],
    isDone: [false],
  });
  /** Sort chosen per project, remembered in this browser. */
  private readonly projectSorts = signal<ProjectSorts>(
    readProjectSorts(this.browserStorage())
  );
  readonly sortOption = computed<ProjectSortOption>(
    () =>
      this.projectSorts()[this.sortKey(this.selectedProjectId())] ??
      DEFAULT_PROJECT_SORT
  );
  readonly filterOption = signal<'all' | 'done' | 'not-done' | 'suspended'>(
    'not-done'
  );
  private redirectScheduled = false;

  constructor() {
    effect(() => {
      const ready = this.session.isReady();
      const user = this.user();

      if (ready && !user && !this.redirectScheduled) {
        this.redirectScheduled = true;
        setTimeout(() => this.router.navigateByUrl('/auth'), 1500);
      }
    });

    this.route.paramMap.subscribe((params) => {
      const projectId = params.get('projectId');
      this.viewState.selectProject(projectId);
    });

    effect(() => {
      const projectId = this.selectedProjectId();
      const project = this.projectList().find((item) => item.id === projectId);

      if (
        project &&
        !this.workspaces.includesProject(project, this.projectList())
      ) {
        this.workspaces.select(
          this.workspaces.workspaceFor(project, this.projectList())
        );
      }
    });

    this.route.queryParamMap.subscribe((params) => {
      const due = params.get('due');
      const month = params.get('month');

      if (due) {
        this.viewState.setDayFilter(due);

        return;
      }

      if (month) {
        this.viewState.setMonthFilter(month);

        return;
      }

      this.viewState.clearDateFilter();
    });
  }

  async createTask(): Promise<void> {
    if (this.form.invalid || !this.user()) {
      this.form.markAllAsTouched();

      return;
    }

    const currentUser = this.user();

    if (!currentUser) {
      return;
    }

    const payload: TaskCreateInput = {
      ownerId: currentUser.id,
      name: this.form.value.name ?? '',
      estimateMinutes: this.form.value.estimateMinutes ?? null,
      projectId: this.form.value.projectId || this.inboxProjectId() || null,
      assigneeIds: defaultTaskAssigneeIds(
        this.projectList().find(
          (project) =>
            project.id === (this.form.value.projectId || this.inboxProjectId())
        ),
        currentUser.id
      ),
    };

    await this.tasksService.createTask(payload);
    this.form.reset({ name: '', estimateMinutes: null, projectId: '' });
  }

  async toggleTask(taskId: string, isDone: boolean) {
    await this.tasksService.updateTask({ id: taskId, isDone });
  }

  async deleteTask(taskId: string) {
    await this.tasksService.deleteTask(taskId);
  }

  selectProject(projectId: string | null) {
    this.viewState.selectProject(projectId);
    this.selectedTaskId.set(null);
    this.populateTaskEditForm();

    if (projectId) {
      void this.router.navigate(['/app/tasks', projectId]);
    } else {
      void this.router.navigate(['/app/tasks']);
    }
  }

  async setProjectTaskView(
    project: Project,
    mode: 'extended' | 'simple'
  ): Promise<void> {
    try {
      const updated = await this.projectsService.updateProject({
        id: project.id,
        taskView: mode,
      });

      if (!updated) {
        throw new Error('Update returned null');
      }

      this.toasts.success(
        mode === 'simple'
          ? 'Simple list enabled.'
          : 'Extended card view enabled.'
      );
    } catch (error) {
      console.error('[AppShell] Failed to toggle project view', error);
      this.toasts.error('Failed to update project view.');
    }
  }

  setSort(option: ProjectSortOption) {
    const key = this.sortKey(this.selectedProjectId());
    const next = { ...this.projectSorts(), [key]: option };

    this.projectSorts.set(next);
    writeProjectSorts(this.browserStorage(), next);
  }

  /** Inbox and "no project" share one key; projects use their IDs. */
  private sortKey(projectId: string | null): string {
    return projectId ?? 'inbox';
  }

  private browserStorage(): Storage | undefined {
    try {
      return typeof localStorage === 'undefined' ? undefined : localStorage;
    } catch {
      return undefined;
    }
  }

  setFilter(option: 'all' | 'done' | 'not-done' | 'suspended') {
    this.filterOption.set(option);
  }

  trackTask(_index: number, task: Task): string {
    return task.id;
  }

  async openProjectEdit(project: Project): Promise<void> {
    await this.composer.openProjectModal({
      mode: 'edit',
      project,
    });
  }

  private sortTasks(tasks: ReturnType<typeof this.taskList>) {
    const option = this.sortOption();
    const byString = (a: string, b: string) => a.localeCompare(b);

    const priorityRank = (priority: string): number => {
      switch (priority.trim().toUpperCase()) {
        case 'A':
          return 3;
        case 'B':
          return 2;
        case 'C':
          return 1;
        default:
          return 0;
      }
    };

    return [...tasks].sort((a, b) => {
      switch (option) {
        case 'priority-asc':
          return priorityRank(a.priority) - priorityRank(b.priority);
        case 'priority-desc':
          return priorityRank(b.priority) - priorityRank(a.priority);
        case 'due-asc':
          return (
            (a.finishDate ? new Date(a.finishDate).getTime() : Infinity) -
            (b.finishDate ? new Date(b.finishDate).getTime() : Infinity)
          );
        case 'due-desc':
          return (
            (b.finishDate ? new Date(b.finishDate).getTime() : -Infinity) -
            (a.finishDate ? new Date(a.finishDate).getTime() : -Infinity)
          );
        case 'created-asc':
          return (
            (a.createdAt ? new Date(a.createdAt).getTime() : 0) -
            (b.createdAt ? new Date(b.createdAt).getTime() : 0)
          );
        case 'created-desc':
          return (
            (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
            (a.createdAt ? new Date(a.createdAt).getTime() : 0)
          );
        case 'modified-asc':
          return (
            (a.updatedAt ? new Date(a.updatedAt).getTime() : 0) -
            (b.updatedAt ? new Date(b.updatedAt).getTime() : 0)
          );
        case 'modified-desc':
          return (
            (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) -
            (a.updatedAt ? new Date(a.updatedAt).getTime() : 0)
          );
        case 'alpha-asc':
          return byString(a.name.toLowerCase(), b.name.toLowerCase());
        case 'alpha-desc':
          return byString(b.name.toLowerCase(), a.name.toLowerCase());
        default:
          return 0;
      }
    });
  }

  reorderDay(reorder: TaskReorder): void {
    const dayKey = this.selectedDayKey();

    if (dayKey)
      this.dayPlan.move(dayKey, reorder.ids, reorder.from, reorder.to);
  }

  resetDayOrder(): void {
    const dayKey = this.selectedDayKey();

    if (dayKey) this.dayPlan.reset(dayKey);
  }

  async addTaskToProject(): Promise<void> {
    const projectId = this.selectedProjectId();
    const currentUser = this.user();

    if (!projectId || !currentUser || this.projectTaskForm.invalid) {
      this.projectTaskForm.markAllAsTouched();

      return;
    }

    const payload: TaskCreateInput = {
      ownerId: currentUser.id,
      name: this.projectTaskForm.value.name ?? '',
      projectId,
      assigneeIds: defaultTaskAssigneeIds(
        this.projectList().find((project) => project.id === projectId),
        currentUser.id
      ),
    };

    await this.tasksService.createTask(payload);
    this.projectTaskForm.reset({ name: '' });
  }

  selectTask(taskId: string) {
    this.selectedTaskId.set(taskId);
    this.populateTaskEditForm();
  }

  activeTask() {
    const selected = this.selectedTaskId();

    if (!selected) {
      return this.filteredTasks()[0] ?? null;
    }

    return this.taskList().find((task) => task.id === selected) ?? null;
  }

  private populateTaskEditForm() {
    const task = this.activeTask();

    if (!task) {
      this.taskEditForm.reset({
        name: '',
        estimateMinutes: 0,
        projectId: '',
        isDone: false,
      });

      return;
    }

    this.taskEditForm.reset({
      name: task.name,
      estimateMinutes: task.estimateMinutes ?? 0,
      projectId: task.projectId ?? '',
      isDone: task.isDone,
    });
  }

  async updateSelectedTask(): Promise<void> {
    const task = this.activeTask();

    if (!task || this.taskEditForm.invalid) {
      this.taskEditForm.markAllAsTouched();

      return;
    }

    await this.tasksService.updateTask({
      id: task.id,
      name: this.taskEditForm.value.name ?? task.name,
      estimateMinutes:
        this.taskEditForm.value.estimateMinutes ?? task.estimateMinutes,
      projectId: this.taskEditForm.value.projectId || null,
      isDone: this.taskEditForm.value.isDone ?? task.isDone,
    });
  }

  refreshTasks(): void {
    void this.tasksService.refresh();
  }

  refreshProjects(): void {
    void this.projectsService.refresh();
  }

  refreshTags(): void {
    void this.tagsService.refresh();
  }

  projectForTask(task: Task): Project | null {
    const projectId = task.projectId ?? null;

    if (!projectId) {
      return null;
    }

    return this.projectLookup().get(projectId) ?? null;
  }

  readonly projectForTaskList = (task: Task): Project | null =>
    this.projectForTask(task);

  clearDueDateFilter(): void {
    this.viewState.clearDateFilter();
    void this.router.navigate(['/app/tasks'], { queryParams: {} });
  }
}
