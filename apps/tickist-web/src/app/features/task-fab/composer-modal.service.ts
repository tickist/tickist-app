import { Injectable, signal } from '@angular/core';
import { Project } from '../../data/project-data.service';
import { Task } from '../../data/task-data.service';

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
  readonly taskModalOpen = signal(false);
  readonly projectModalOpen = signal(false);
  readonly projectComposerPreset = signal<ProjectComposerPreset | null>(null);
  readonly taskComposerPreset = signal<TaskComposerPreset | null>(null);

  openTaskModal(preset: TaskComposerPreset = { mode: 'create' }): void {
    this.taskComposerPreset.set(preset);
    this.taskModalOpen.set(true);
  }

  closeTaskModal(): void {
    this.taskModalOpen.set(false);
    this.taskComposerPreset.set(null);
  }

  openProjectModal(preset: ProjectComposerPreset): void {
    this.projectComposerPreset.set(preset);
    this.projectModalOpen.set(true);
  }

  closeProjectModal(): void {
    this.projectModalOpen.set(false);
    this.projectComposerPreset.set(null);
  }
}
