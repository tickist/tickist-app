import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';

import { Project } from '../../data/project-data.service';
import { Task } from '../../data/task-data.service';
import { TaskCardComponent } from './task-card.component';

type TaskViewMode = 'extended' | 'simple';
type TaskProjectResolver = (task: Task) => Project | null;

@Component({
  selector: 'app-task-list',
  imports: [TaskCardComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  readonly tasks = input.required<readonly Task[]>();
  readonly project = input<Project | null>(null);
  readonly projectResolver = input<TaskProjectResolver | null>(null);
  readonly viewMode = input<TaskViewMode>('extended');
  readonly emptyText = input('No tasks yet.');
  readonly openMenuTaskId = signal<string | null>(null);

  projectFor(task: Task): Project | null {
    const resolver = this.projectResolver();
    return resolver ? resolver(task) : this.project();
  }

  trackTask(_index: number, task: Task): string {
    return task.id;
  }

  setTaskMenuOpen(taskId: string, open: boolean): void {
    if (open) {
      this.openMenuTaskId.set(taskId);
      return;
    }
    if (this.openMenuTaskId() === taskId) {
      this.openMenuTaskId.set(null);
    }
  }
}
