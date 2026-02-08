import { Component, HostListener, ElementRef, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { Project, ProjectDataService } from '../../data/project-data.service';
import { AppViewStateService } from './app-view-state.service';
import { TaskDataService } from '../../data/task-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { ComposerModalService } from '../task-fab/composer-modal.service';

type NavSectionState = {
  inbox: boolean;
  active: boolean;
  someday: boolean;
  routine: boolean;
  weekdays: boolean;
  future: boolean;
  tags: boolean;
};

type WeekdayItem = {
  label: string;
  dateKey: string;
  count: number;
  isToday: boolean;
};

type FutureItem = {
  label: string;
  monthKey: string;
  count: number;
};

type ProjectTreeNode = {
  project: Project;
  children: ProjectTreeNode[];
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.css',
})
export class AppSidebarComponent {
  private readonly projectsService = inject(ProjectDataService);
  private readonly viewState = inject(AppViewStateService);
  private readonly router = inject(Router);
  private readonly tasksService = inject(TaskDataService);
  private readonly composer = inject(ComposerModalService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly session = inject(SupabaseSessionService);

  readonly projectList = computed(() => this.projectsService.list());
  readonly selectedProjectId = this.viewState.selectedProjectId;
  readonly taskList = computed(() => this.tasksService.list());
  readonly user = computed(() => this.session.user());
  readonly dueDateFilter = this.viewState.dueDateFilter;
  readonly navState = signal<NavSectionState>({
    inbox: true,
    active: true,
    someday: false,
    routine: false,
    weekdays: false,
    future: false,
    tags: false,
  });
  readonly hoveredProjectId = signal<string | null>(null);
  readonly menuProjectId = signal<string | null>(null);
  readonly menuPosition = signal<{ top: number; left: number } | null>(null);
  readonly menuProject = computed(() => {
    const projectId = this.menuProjectId();
    if (!projectId) {
      return null;
    }
    return this.projectList().find((project) => project.id === projectId) ?? null;
  });

  readonly inboxProjects = computed(() =>
    this.projectList().filter((project) => project.isInbox)
  );
  readonly activeProjectsList = computed(() =>
    this.projectList().filter(
      (project) =>
        project.projectType?.toLowerCase() === 'active' && !project.isInbox
    )
  );
  readonly somedayProjectsList = computed(() =>
    this.projectList().filter(
      (project) =>
        (project.projectType?.toLowerCase() === 'someday' ||
          project.projectType?.toLowerCase() === 'maybe') &&
        !project.isInbox
    )
  );
  readonly routineProjectsList = computed(() =>
    this.projectList().filter(
      (project) =>
        project.projectType?.toLowerCase() === 'routine' && !project.isInbox
    )
  );
  readonly weekdayItems = computed<WeekdayItem[]>(() => {
    const userId = this.user()?.id;
    if (!userId) {
      return [];
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_value, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      return date;
    });
    const countByDate = new Map<string, number>();
    for (const task of this.taskList()) {
      if (task.ownerId !== userId || task.isDone || !task.finishDate) {
        continue;
      }
      const finishDate = new Date(task.finishDate);
      if (Number.isNaN(finishDate.getTime())) {
        continue;
      }
      finishDate.setHours(0, 0, 0, 0);
      const key = this.dateKey(finishDate);
      countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
    }
    return days.map((date, index) => {
      const key = this.dateKey(date);
      const label =
        index === 0
          ? 'Today'
          : index === 1
          ? 'Tomorrow'
          : date.toLocaleDateString('en-US', { weekday: 'long' });
      return {
        label,
        dateKey: key,
        count: countByDate.get(key) ?? 0,
        isToday: index === 0,
      };
    });
  });
  readonly futureItems = computed<FutureItem[]>(() => {
    const userId = this.user()?.id;
    if (!userId) {
      return [];
    }
    const today = new Date();
    const startMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const months = Array.from({ length: 12 }, (_value, index) => {
      return new Date(startMonth.getFullYear(), startMonth.getMonth() + index, 1);
    });
    const countByMonth = new Map<string, number>();
    for (const task of this.taskList()) {
      if (task.ownerId !== userId || task.isDone || !task.finishDate) {
        continue;
      }
      const finishDate = new Date(task.finishDate);
      if (Number.isNaN(finishDate.getTime())) {
        continue;
      }
      const key = this.monthKey(finishDate);
      countByMonth.set(key, (countByMonth.get(key) ?? 0) + 1);
    }
    return months.map((date) => {
      const key = this.monthKey(date);
      const label = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      return {
        label,
        monthKey: key,
        count: countByMonth.get(key) ?? 0,
      };
    });
  });
  readonly activeTree = computed(() => this.buildTree('active'));
  readonly somedayTree = computed(() => this.buildTree('someday'));
  readonly routineTree = computed(() => this.buildTree('routine'));
  readonly projectTaskCounts = computed(() => {
    const counts = new Map<string, number>();
    const inboxByOwner = new Map<string, string>();
    for (const inbox of this.inboxProjects()) {
      inboxByOwner.set(inbox.ownerId, inbox.id);
    }
    const userId = this.user()?.id;
    if (!userId) {
      return counts;
    }
    for (const task of this.taskList()) {
      if (task.ownerId !== userId) {
        continue;
      }
      if (task.isDone) {
        continue;
      }
      const projectId =
        task.projectId ?? inboxByOwner.get(task.ownerId) ?? null;
      if (!projectId) {
        continue;
      }
      counts.set(projectId, (counts.get(projectId) ?? 0) + 1);
    }
    return counts;
  });

  toggle(section: keyof NavSectionState): void {
    this.navState.update((state) => ({
      ...state,
      [section]: !state[section],
    }));
  }

  selectWeekday(day: WeekdayItem): void {
    const current = this.dueDateFilter();
    if (current?.mode === 'day' && current.dateKey === day.dateKey) {
      this.viewState.clearDateFilter();
      void this.router.navigate(['/app/tasks'], { queryParams: {} });
      return;
    }
    this.viewState.setDayFilter(day.dateKey);
    this.viewState.selectProject(null);
    void this.router.navigate(['/app/tasks'], { queryParams: { due: day.dateKey } });
  }

  selectFutureMonth(month: FutureItem): void {
    const current = this.dueDateFilter();
    if (current?.mode === 'month' && current.monthKey === month.monthKey) {
      this.viewState.clearDateFilter();
      void this.router.navigate(['/app/tasks'], { queryParams: {} });
      return;
    }
    this.viewState.setMonthFilter(month.monthKey);
    this.viewState.selectProject(null);
    void this.router.navigate(['/app/tasks'], { queryParams: { month: month.monthKey } });
  }

  selectSpecificDate(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    if (!value) {
      this.viewState.clearDateFilter();
      void this.router.navigate(['/app/tasks'], { queryParams: {} });
      return;
    }
    this.viewState.setDayFilter(value);
    this.viewState.selectProject(null);
    void this.router.navigate(['/app/tasks'], { queryParams: { due: value } });
  }

  isWeekdaySelected(day: WeekdayItem): boolean {
    const current = this.dueDateFilter();
    return current?.mode === 'day' && current.dateKey === day.dateKey;
  }

  isFutureSelected(month: FutureItem): boolean {
    const current = this.dueDateFilter();
    return current?.mode === 'month' && current.monthKey === month.monthKey;
  }

  goToDashboard(): void {
    this.viewState.selectProject(null);
    void this.router.navigate(['/app']);
  }

  selectProject(projectId: string | null): void {
    this.viewState.selectProject(projectId);
    if (projectId) {
      void this.router.navigate(['/app/tasks', projectId]);
    } else {
      void this.router.navigate(['/app/tasks']);
    }
  }

  projectTaskCount(projectId: string | null): number {
    if (!projectId) {
      return 0;
    }
    return this.projectTaskCounts().get(projectId) ?? 0;
  }

  onProjectEnter(projectId: string): void {
    this.hoveredProjectId.set(projectId);
  }

  onProjectLeave(projectId: string): void {
    if (this.menuProjectId() !== projectId) {
      this.hoveredProjectId.set(null);
    }
  }

  toggleMenu(projectId: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.menuProjectId() === projectId) {
      this.closeMenu();
      return;
    }
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const width = 224; // 14rem ~ w-56
    const height = 240;
    const gutter = 8;
    const left = Math.min(rect.right + gutter, window.innerWidth - width - gutter);
    let top = rect.bottom + gutter;
    if (top + height > window.innerHeight) {
      top = Math.max(rect.top - height - gutter, gutter);
    }
    this.menuPosition.set({ top, left });
    this.menuProjectId.set(projectId);
    this.hoveredProjectId.set(projectId);
  }

  closeMenu(): void {
    this.menuProjectId.set(null);
    this.menuPosition.set(null);
    this.hoveredProjectId.set(null);
  }

  projectTypeKey(project: Project): 'active' | 'someday' | 'routine' {
    const type = (project.projectType ?? 'active').toLowerCase();
    if (type === 'routine') {
      return 'routine';
    }
    if (type === 'someday' || type === 'maybe') {
      return 'someday';
    }
    return 'active';
  }

  openCreateProject(projectType: string, ancestorId?: string | null): void {
    this.closeMenu();
    this.composer.openProjectModal({
      mode: 'create',
      defaults: {
        projectType,
        ancestorId: ancestorId ?? undefined,
      },
    });
  }

  editProject(project: Project): void {
    this.closeMenu();
    this.composer.openProjectModal({
      mode: 'edit',
      project,
    });
  }

  async convertProjectType(project: Project, projectType: string): Promise<void> {
    this.closeMenu();
    await this.projectsService.updateProject({
      id: project.id,
      projectType,
    });
  }

  async deleteProject(project: Project): Promise<void> {
    this.closeMenu();
    const confirmed = confirm(
      `Delete project "${project.name}"? Tasks will be left unattached.`
    );
    if (!confirmed) {
      return;
    }
    await this.projectsService.deleteProject(project.id);
  }

  createChildProject(project: Project): void {
    this.closeMenu();
    this.openCreateProject(project.projectType ?? 'active', project.id);
  }

  @HostListener('document:click', ['$event'])
  closeMenus(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  closeMenuOnEscape(): void {
    if (this.menuProjectId()) {
      this.closeMenu();
    }
  }

  private buildTree(type: string): ProjectTreeNode[] {
    const all = this.projectList().filter(
      (project) =>
        project.projectType?.toLowerCase() === type && !project.isInbox
    );
    const nodeMap = new Map<string, ProjectTreeNode>();
    all.forEach((project) =>
      nodeMap.set(project.id, { project, children: [] })
    );
    const roots: ProjectTreeNode[] = [];
    for (const node of nodeMap.values()) {
      const parentNode = node.project.ancestorId
        ? nodeMap.get(node.project.ancestorId)
        : undefined;
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }
    const sortNodes = (nodes: ProjectTreeNode[]) => {
      nodes.sort((a, b) => a.project.name.localeCompare(b.project.name));
      nodes.forEach((n) => sortNodes(n.children));
    };
    sortNodes(roots);
    return roots;
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
}
