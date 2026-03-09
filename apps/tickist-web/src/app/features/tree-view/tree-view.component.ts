import { Component, computed, inject, signal } from '@angular/core';
import { TaskDataService } from '../../data/task-data.service';
import { ProjectDataService } from '../../data/project-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { DatePipe } from '@angular/common';
import { AppViewStateService } from '../app-shell/app-view-state.service';
import { LinkifyPipe } from '../../core/text/linkify.pipe';

interface TreeGroup {
  id: string;
  name: string;
  color: string;
  tasks: {
    id: string;
    name: string;
    isDone: boolean;
    finishDate?: string | null;
    priority: string;
  }[];
}

@Component({
  selector: 'app-tree-view',
  standalone: true,
  imports: [DatePipe, LinkifyPipe],
  templateUrl: './tree-view.component.html',
  styleUrl: './tree-view.component.css',
})
export class TreeViewComponent {
  private readonly tasks = inject(TaskDataService);
  private readonly projects = inject(ProjectDataService);
  private readonly session = inject(SupabaseSessionService);
  private readonly viewState = inject(AppViewStateService);

  readonly user = computed(() => this.session.user());
  readonly searchTerm = this.viewState.searchTerm;
  readonly taskList = computed(() => {
    const normalizedSearch = this.searchTerm().trim().toLowerCase();
    return this.tasks.list().filter((task) => {
      if (task.ownerId !== this.user()?.id) {
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
  readonly projectList = computed(() =>
    this.projects
      .list()
      .filter((project) => project.ownerId === this.user()?.id)
  );

  readonly groups = computed<TreeGroup[]>(() => {
    const projects = this.projectList();
    const tasks = this.taskList();
    const map = new Map<string, TreeGroup>();

    for (const project of projects) {
      map.set(project.id, {
        id: project.id,
        name: project.name,
        color: project.color,
        tasks: [],
      });
    }

    const inboxId = 'inbox';
    if (!map.has(inboxId)) {
      map.set(inboxId, {
        id: inboxId,
        name: 'Inbox',
        color: '#394264',
        tasks: [],
      });
    }

    for (const task of tasks) {
      const projectId = task.projectId ?? inboxId;
      if (!map.has(projectId)) {
        map.set(projectId, {
          id: projectId,
          name: 'Unknown project',
          color: '#394264',
          tasks: [],
        });
      }
      map.get(projectId)?.tasks.push({
        id: task.id,
        name: task.name,
        isDone: task.isDone,
        finishDate: task.finishDate,
        priority: task.priority,
      });
    }

    return Array.from(map.values()).map((group) => ({
      ...group,
      tasks: group.tasks.sort((a, b) => a.name.localeCompare(b.name)),
    }));
  });

  readonly expanded = signal<Set<string>>(new Set());

  toggle(groupId: string): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  isExpanded(groupId: string): boolean {
    return this.expanded().has(groupId);
  }
}
