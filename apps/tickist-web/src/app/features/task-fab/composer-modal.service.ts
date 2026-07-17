import { Injectable, inject } from '@angular/core';
import { Params, Router } from '@angular/router';
import { Project } from '../../data/project-data.service';
import { Task } from '../../data/task-data.service';
import { AppViewStateService } from '../app-shell/app-view-state.service';

export type ProjectComposerMode = 'create' | 'edit';
export type TaskComposerMode = 'create' | 'edit';

export interface ProjectComposerPreset {
  mode: ProjectComposerMode;
  project?: Project;
  defaults?: {
    projectType?: string;
    ancestorId?: string | null;
    color?: string;
    icon?: string;
  };
}

export interface TaskComposerPreset {
  mode: TaskComposerMode;
  task?: Task;
  defaults?: {
    projectId?: string | null;
    tags?: string[];
    priority?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ComposerModalService {
  private readonly router = inject(Router);
  private readonly viewState = inject(AppViewStateService);

  async openTaskModal(
    preset: TaskComposerPreset = { mode: 'create' }
  ): Promise<void> {
    if (preset.mode === 'edit' && preset.task) {
      await this.router.navigate(['/app/task', preset.task.id, 'edit']);
      return;
    }

    const defaults = withActiveProjectDefault(preset.defaults, this.router.url);
    await this.router.navigate(['/app/task/new'], {
      queryParams: buildTaskQueryParams(defaults),
    });
  }

  async closeTaskModal(): Promise<void> {
    await this.navigateBack();
  }

  async openProjectModal(preset: ProjectComposerPreset): Promise<void> {
    if (preset.mode === 'edit' && preset.project) {
      await this.router.navigate(['/app/project', preset.project.id, 'edit']);
      return;
    }

    await this.router.navigate(['/app/project/new'], {
      queryParams: buildProjectQueryParams(preset.defaults),
    });
  }

  async closeProjectModal(): Promise<void> {
    await this.navigateBack();
  }

  private async navigateBack(): Promise<void> {
    await this.router.navigateByUrl(
      this.viewState.lastNonSheetAppUrl() ?? '/app'
    );
  }
}

function withActiveProjectDefault(
  defaults: TaskComposerPreset['defaults'],
  currentUrl: string
): TaskComposerPreset['defaults'] {
  if (defaults && Object.prototype.hasOwnProperty.call(defaults, 'projectId')) {
    return defaults;
  }

  const match = currentUrl.match(/^\/app\/tasks\/([^/?#]+)(?:[/?#]|$)/);
  if (!match?.[1]) {
    return defaults;
  }

  return {
    ...defaults,
    projectId: decodeURIComponent(match[1]),
  };
}

function buildTaskQueryParams(
  defaults: TaskComposerPreset['defaults']
): Params | undefined {
  if (!defaults) {
    return undefined;
  }

  const params: Params = {};
  if (defaults.projectId) {
    params['projectId'] = defaults.projectId;
  }
  if (defaults.priority) {
    params['priority'] = defaults.priority;
  }
  if (defaults.tags?.length) {
    params['tags'] = defaults.tags.join(',');
  }
  return Object.keys(params).length ? params : undefined;
}

function buildProjectQueryParams(
  defaults: ProjectComposerPreset['defaults']
): Params | undefined {
  if (!defaults) {
    return undefined;
  }

  const params: Params = {};
  if (defaults.projectType) {
    params['projectType'] = defaults.projectType;
  }
  if (defaults.ancestorId) {
    params['ancestorId'] = defaults.ancestorId;
  }
  if (defaults.color) {
    params['color'] = defaults.color;
  }
  if (defaults.icon) {
    params['icon'] = defaults.icon;
  }
  return Object.keys(params).length ? params : undefined;
}
