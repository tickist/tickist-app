import { Component, computed, effect, inject, signal } from '@angular/core';
import { SupabaseSessionService } from '../auth/supabase-session.service';

import {
  Task,
  TaskDataService,
  TaskCreateInput,
} from '../../data/task-data.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Project, ProjectDataService } from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AppViewStateService } from './app-view-state.service';
import { TaskCardComponent } from './task-card.component';
import { ProjectHeaderComponent } from './project-header.component';
import { ToastService } from '../../core/ui/toast.service';
import { ComposerModalService } from '../task-fab/composer-modal.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [ReactiveFormsModule, TaskCardComponent, ProjectHeaderComponent],
  templateUrl: './app-shell.component.html',
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
      const date = this.parseDateKey(filter.dateKey);
      return date
        ? date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })
        : filter.dateKey;
    }
    const date = this.parseMonthKey(filter.monthKey);
    return date
      ? date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })
      : filter.monthKey;
  });
  readonly taskViewMode = computed(() =>
    this.activeProject()?.taskView === 'simple' ? 'simple' : 'extended'
  );
  readonly projectTaskForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
  });
  readonly filteredTasks = computed(() => {
    const tasks = this.taskList();
    const projectId = this.selectedProjectId();
    const inboxId = this.inboxProjectId();
    const normalizedSearch = this.searchTerm().trim().toLowerCase();
    const dueFilter = this.dueDateFilter();
    const filtered = tasks.filter((task) => {
      const matchesProject = projectId
        ? projectId === inboxId
          ? task.projectId === projectId || !task.projectId
          : task.projectId === projectId
        : true;
      const matchesSearch = normalizedSearch
        ? task.name.toLowerCase().includes(normalizedSearch) ||
          (task.description ?? '').toLowerCase().includes(normalizedSearch)
        : true;
      const matchesFilter =
        this.filterOption() === 'all'
          ? true
          : this.filterOption() === 'done'
          ? task.isDone
          : !task.isDone;
      const matchesDueDate = (() => {
        if (!dueFilter) {
          return true;
        }
        if (!task.finishDate) {
          return false;
        }
        const finishDate = new Date(task.finishDate);
        if (Number.isNaN(finishDate.getTime())) {
          return false;
        }
        finishDate.setHours(0, 0, 0, 0);
        if (dueFilter.mode === 'day') {
          return this.dateKey(finishDate) === dueFilter.dateKey;
        }
        return this.monthKey(finishDate) === dueFilter.monthKey;
      })();
      return matchesProject && matchesSearch && matchesFilter && matchesDueDate;
    });
    return this.sortTasks(filtered);
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
    estimateMinutes: [15, [Validators.min(0)]],
    projectId: [''],
  });
  readonly taskEditForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    estimateMinutes: [0, [Validators.min(0)]],
    projectId: [''],
    isDone: [false],
  });
  readonly sortOption = signal<
    | 'priority-desc'
    | 'priority-asc'
    | 'due-asc'
    | 'due-desc'
    | 'created-asc'
    | 'created-desc'
    | 'alpha-asc'
    | 'alpha-desc'
  >('priority-desc');
  readonly filterOption = signal<'all' | 'done' | 'not-done'>('not-done');
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
    };
    await this.tasksService.createTask(payload);
    this.form.reset({ name: '', estimateMinutes: 15, projectId: '' });
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

  setSort(
    option:
      | 'priority-desc'
      | 'priority-asc'
      | 'due-asc'
      | 'due-desc'
      | 'created-asc'
      | 'created-desc'
      | 'alpha-asc'
      | 'alpha-desc'
  ) {
    this.sortOption.set(option);
  }

  setFilter(option: 'all' | 'done' | 'not-done') {
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
    return [...tasks].sort((a, b) => {
      switch (option) {
        case 'priority-asc':
          return byString(a.priority ?? '', b.priority ?? '');
        case 'priority-desc':
          return byString(b.priority ?? '', a.priority ?? '');
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
        case 'alpha-asc':
          return byString(a.name.toLowerCase(), b.name.toLowerCase());
        case 'alpha-desc':
          return byString(b.name.toLowerCase(), a.name.toLowerCase());
        default:
          return 0;
      }
    });
  }

  private dateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private monthKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${year}-${month}`;
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

  clearDueDateFilter(): void {
    this.viewState.clearDateFilter();
    void this.router.navigate(['/app/tasks'], { queryParams: {} });
  }

  private parseDateKey(key: string): Date | null {
    const [year, month, day] = key.split('-').map(Number);
    if (!year || !month || !day) {
      return null;
    }
    return new Date(year, month - 1, day);
  }

  private parseMonthKey(key: string): Date | null {
    const [year, month] = key.split('-').map(Number);
    if (!year || !month) {
      return null;
    }
    return new Date(year, month - 1, 1);
  }
}
