import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { TaskComposerComponent } from './task-composer.component';
import { ProjectComposerComponent } from './project-composer.component';
import { ComposerModalService } from './composer-modal.service';

@Component({
  selector: 'app-task-fab',
  standalone: true,
  imports: [NgIf, TaskComposerComponent, ProjectComposerComponent],
  templateUrl: './task-fab.component.html',
  styleUrl: './task-fab.component.css',
})
export class TaskFabComponent {
  readonly hovered = signal(false);
  private readonly composer = inject(ComposerModalService);

  showTaskModal(): void {
    this.composer.openTaskModal();
  }

  closeTaskModal(): void {
    this.composer.closeTaskModal();
  }

  showProjectModal(): void {
    this.composer.openProjectModal({ mode: 'create' });
  }

  closeProjectModal(): void {
    this.composer.closeProjectModal();
  }

  taskModalOpen() {
    return this.composer.taskModalOpen();
  }

  taskPreset() {
    return this.composer.taskComposerPreset();
  }

  projectModalOpen() {
    return this.composer.projectModalOpen();
  }

  projectPreset() {
    return this.composer.projectComposerPreset();
  }
}
