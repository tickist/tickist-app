import {
  CdkDrag,
  type CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { ToastService } from '../../core/ui/toast.service';
import { Project } from '../../data/project-data.service';
import { Task } from '../../data/task-data.service';
import { TaskCardComponent } from './task-card.component';

type TaskViewMode = 'extended' | 'simple';

type TaskProjectResolver = (task: Task) => Project | null;

export interface TaskReorder {
  /** Task IDs in the order shown before the move. */
  ids: string[];
  from: number;
  to: number;
}

@Component({
  selector: 'app-task-list',
  imports: [TaskCardComponent, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly toasts = inject(ToastService);

  readonly tasks = input.required<readonly Task[]>();
  readonly project = input<Project | null>(null);
  readonly projectResolver = input<TaskProjectResolver | null>(null);
  readonly viewMode = input<TaskViewMode>('extended');
  readonly emptyText = input('No tasks yet.');
  /** Shows a drag handle on each task and emits `reordered` on moves. */
  readonly reorderable = input(false);
  readonly reordered = output<TaskReorder>();

  /** Cards from this index on render lazily (likely below the first screen). */
  readonly deferRenderingFrom = 8;
  readonly openMenuTaskId = signal<string | null>(null);
  /** Task picked up with the keyboard (Space or Enter on its handle). */
  readonly grabbedId = signal<string | null>(null);
  readonly dragging = signal(false);
  private grabbedFromIndex = 0;
  private refocusing = false;

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

  onDrop(event: CdkDragDrop<readonly Task[]>): void {
    this.dragging.set(false);

    const task = this.tasks()[event.previousIndex];

    if (!task || event.previousIndex === event.currentIndex) return;

    this.emitMove(event.previousIndex, event.currentIndex);
    this.toasts.announceStatus(
      `Moved ${task.name} to position ${event.currentIndex + 1} of ${
        this.tasks().length
      }.`
    );
  }

  /**
   * Grab, move, drop: Space or Enter picks the task up, arrows move it,
   * Space or Enter drops it and Escape puts it back.
   */
  onHandleKeydown(event: KeyboardEvent, task: Task, index: number): void {
    const grabbed = this.grabbedId() === task.id;

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();

      if (grabbed) {
        this.drop(task, index);
      } else {
        this.grabbedId.set(task.id);
        this.grabbedFromIndex = index;
        this.toasts.announceStatus(
          `Grabbed ${task.name}, position ${index + 1} of ${
            this.tasks().length
          }. Use the up and down arrows to move it, Space to drop, Escape to cancel.`
        );
      }

      return;
    }

    if (!grabbed) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.grabbedId.set(null);

      if (index !== this.grabbedFromIndex) {
        this.emitMove(index, this.grabbedFromIndex);
        this.refocus(task.id);
      }

      this.toasts.announceStatus(`Reorder cancelled. ${task.name} is back.`);

      return;
    }

    const step =
      event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;

    if (step === 0) return;

    event.preventDefault();

    const target = index + step;

    if (target < 0 || target >= this.tasks().length) return;

    this.emitMove(index, target);
    this.refocus(task.id);
    this.toasts.announceStatus(
      `Moved ${task.name} to position ${target + 1} of ${this.tasks().length}.`
    );
  }

  /** Leaving the handle drops a grabbed task, except during our own refocus. */
  onHandleBlur(task: Task, index: number): void {
    if (this.refocusing || this.grabbedId() !== task.id) return;

    this.drop(task, index);
  }

  private drop(task: Task, index: number): void {
    this.grabbedId.set(null);
    this.toasts.announceStatus(
      `Dropped ${task.name} at position ${index + 1} of ${this.tasks().length}.`
    );
  }

  private emitMove(from: number, to: number): void {
    this.reordered.emit({
      ids: this.tasks().map((task) => task.id),
      from,
      to,
    });
  }

  /** The moved card is re-inserted in the DOM, so focus its handle again. */
  private refocus(taskId: string): void {
    this.refocusing = true;
    afterNextRender(
      () => {
        const handle = this.host.nativeElement.querySelector<HTMLElement>(
          `[data-reorder-handle="${CSS.escape(taskId)}"]`
        );

        handle?.closest('.task-list__item')?.scrollIntoView?.({
          block: 'nearest',
          inline: 'nearest',
        });
        handle?.focus({ preventScroll: true });
        this.refocusing = false;
      },
      { injector: this.injector }
    );
  }
}
