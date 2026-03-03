import { Component, computed, inject } from '@angular/core';
import { TaskDataService, type Task } from '../../data/task-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Project, ProjectDataService } from '../../data/project-data.service';
import { TaskCardComponent } from '../app-shell/task-card.component';
import { AppViewStateService } from '../app-shell/app-view-state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  imports: [SlicePipe, RouterLink, TaskCardComponent],
})
export class DashboardComponent {
  private readonly tasks = inject(TaskDataService);
  private readonly projects = inject(ProjectDataService);
  private readonly session = inject(SupabaseSessionService);
  private readonly viewState = inject(AppViewStateService);

  readonly user = computed(() => this.session.user());
  readonly searchTerm = this.viewState.searchTerm;
  readonly projectList = computed(() =>
    this.projects
      .list()
      .filter((project) => project.ownerId === this.user()?.id)
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
      if (task.ownerId !== this.user()?.id || task.onHold) {
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
  readonly todayTasks = computed(() => {
    const today = new Date();
    return this.taskList().filter((task) => {
      if (!task.finishDate) {
        return false;
      }
      const finishDate = new Date(task.finishDate);
      return (
        finishDate.toDateString() === today.toDateString() && !task.isDone
      );
    });
  });
  readonly overdueTasks = computed(() => {
    const today = new Date();
    return this.taskList().filter((task) => {
      if (!task.finishDate) {
        return false;
      }
      const finishDate = new Date(task.finishDate);
      return finishDate < today && !task.isDone;
    });
  });
  readonly pinnedTasks = computed(() =>
    this.taskList().filter((task) => task.pinned && !task.isDone)
  );
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
      this.taskList()
        .filter(
          (task) => task.taskType === 'next_action' && !task.isDone && task.projectId
        )
        .map((task) => task.projectId as string)
    );

    return this.projectList()
      .filter((project) => project.isActive && !project.isInbox)
      .filter((project) => !nextActionProjects.has(project.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
  readonly sortedTodayTasks = computed(() =>
    [...this.todayTasks()].sort((a, b) => {
      const timeA = a.finishTime ?? '';
      const timeB = b.finishTime ?? '';
      return timeA.localeCompare(timeB);
    })
  );
  readonly sortedOverdueTasks = computed(() =>
    [...this.overdueTasks()].sort((a, b) => {
      const dateA = a.finishDate ?? '';
      const dateB = b.finishDate ?? '';
      return dateB.localeCompare(dateA);
    })
  );

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
