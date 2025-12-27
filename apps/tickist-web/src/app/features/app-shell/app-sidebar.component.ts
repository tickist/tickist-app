import { Component, HostListener, ElementRef, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Project, ProjectDataService } from '../../data/project-data.service';
import { AppViewStateService } from './app-view-state.service';
import { TaskDataService } from '../../data/task-data.service';
import { ComposerModalService } from '../task-fab/composer-modal.service';

type NavSectionState = {
  inbox: boolean;
  active: boolean;
  someday: boolean;
  routine: boolean;
  tags: boolean;
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, NgTemplateOutlet],
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

  readonly projectList = computed(() => this.projectsService.list());
  readonly selectedProjectId = this.viewState.selectedProjectId;
  readonly taskList = computed(() => this.tasksService.list());
  readonly navState = signal<NavSectionState>({
    inbox: true,
    active: true,
    someday: false,
    routine: false,
    tags: false,
  });
  readonly hoveredProjectId = signal<string | null>(null);
  readonly menuProjectId = signal<string | null>(null);
  readonly menuPosition = signal<{ top: number; left: number } | null>(null);

  readonly inboxProjects = computed(() =>
    this.projectList().filter((project) => project.isInbox)
  );
  readonly activeProjectsList = computed(() =>
    this.projectList().filter(
      (project) => project.projectType?.toLowerCase() === 'active'
    )
  );
  readonly somedayProjectsList = computed(() =>
    this.projectList().filter(
      (project) =>
        project.projectType?.toLowerCase() === 'someday' ||
        project.projectType?.toLowerCase() === 'maybe'
    )
  );
  readonly routineProjectsList = computed(() =>
    this.projectList().filter(
      (project) => project.projectType?.toLowerCase() === 'routine'
    )
  );
  readonly activeTree = computed(() => this.buildTree('active'));
  readonly somedayTree = computed(() => this.buildTree('someday'));
  readonly routineTree = computed(() => this.buildTree('routine'));
  readonly projectTaskCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const task of this.taskList()) {
      if (!task.projectId) continue;
      counts.set(task.projectId, (counts.get(task.projectId) ?? 0) + 1);
    }
    return counts;
  });

  toggle(section: keyof NavSectionState): void {
    this.navState.update((state) => ({
      ...state,
      [section]: !state[section],
    }));
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
      this.menuProjectId.set(null);
      this.menuPosition.set(null);
      return;
    }
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const width = 224; // 14rem ~ w-56
    const gutter = 8;
    const left = Math.min(rect.right + gutter + window.scrollX, window.innerWidth - width - gutter);
    const top = rect.top + window.scrollY;
    this.menuPosition.set({ top, left });
    this.menuProjectId.set(projectId);
    this.hoveredProjectId.set(projectId);
  }

  openCreateProject(projectType: string, ancestorId?: string | null): void {
    this.composer.openProjectModal({
      mode: 'create',
      defaults: {
        projectType,
        ancestorId: ancestorId ?? undefined,
      },
    });
  }

  editProject(project: Project): void {
    this.composer.openProjectModal({
      mode: 'edit',
      project,
    });
  }

  async convertProjectType(project: Project, projectType: string): Promise<void> {
    await this.projectsService.updateProject({
      id: project.id,
      projectType,
    });
  }

  async deleteProject(project: Project): Promise<void> {
    const confirmed = confirm(
      `Delete project "${project.name}"? Tasks will be left unattached.`
    );
    if (!confirmed) {
      return;
    }
    await this.projectsService.deleteProject(project.id);
  }

  createChildProject(project: Project): void {
    this.openCreateProject(project.projectType ?? 'active', project.id);
  }

  @HostListener('document:click', ['$event'])
  closeMenus(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.menuProjectId.set(null);
      this.menuPosition.set(null);
      this.hoveredProjectId.set(null);
    }
  }

  private buildTree(type: string) {
    const all = this.projectList().filter(
      (project) => project.projectType?.toLowerCase() === type
    );
    const nodeMap = new Map<string, { project: Project; children: any[] }>();
    all.forEach((project) =>
      nodeMap.set(project.id, { project, children: [] })
    );
    const roots: { project: Project; children: any[] }[] = [];
    for (const node of nodeMap.values()) {
      if (node.project.ancestorId && nodeMap.has(node.project.ancestorId)) {
        nodeMap.get(node.project.ancestorId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    const sortNodes = (nodes: { project: Project; children: any[] }[]) => {
      nodes.sort((a, b) => a.project.name.localeCompare(b.project.name));
      nodes.forEach((n) => sortNodes(n.children));
    };
    sortNodes(roots);
    return roots;
  }
}
