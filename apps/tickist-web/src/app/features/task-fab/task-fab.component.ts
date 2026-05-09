import { Component, inject, signal } from '@angular/core';
import { ComposerModalService } from './composer-modal.service';

@Component({
  selector: 'app-task-fab',
  imports: [],
  templateUrl: './task-fab.component.html',
  styleUrl: './task-fab.component.css',
})
export class TaskFabComponent {
  readonly hovered = signal(false);
  private readonly composer = inject(ComposerModalService);

  async showTaskModal(): Promise<void> {
    await this.composer.openTaskModal();
  }

  async showProjectModal(): Promise<void> {
    await this.composer.openProjectModal({ mode: 'create' });
  }
}
