import { DestroyRef, Injectable, inject, signal } from '@angular/core';

import { Task } from './task-data.service';

const STATUS_CLOCK_INTERVAL_MS = 30_000;
export type TaskStatusFilter = 'all' | 'done' | 'not-done' | 'suspended';

@Injectable({ providedIn: 'root' })
export class TaskStatusService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly nowMs = signal(Date.now());

  constructor() {
    const timer = setInterval(() => {
      this.nowMs.set(Date.now());
    }, STATUS_CLOCK_INTERVAL_MS);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  isSuspended(task: Task): boolean {
    return isTaskSuspended(task, this.nowMs());
  }

  isAvailable(task: Task): boolean {
    return !this.isSuspended(task);
  }

  matchesFilter(task: Task, filter: TaskStatusFilter): boolean {
    return taskMatchesStatusFilter(task, filter, this.nowMs());
  }
}

export function isTaskSuspended(task: Task, nowMs = Date.now()): boolean {
  if (task.isActive) {
    return false;
  }
  if (!task.suspendUntil) {
    return true;
  }

  const suspendUntilMs = Date.parse(task.suspendUntil);
  return Number.isNaN(suspendUntilMs) || suspendUntilMs > nowMs;
}

export function taskMatchesStatusFilter(
  task: Task,
  filter: TaskStatusFilter,
  nowMs = Date.now()
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'done':
      return task.isDone;
    case 'suspended':
      return !task.isDone && isTaskSuspended(task, nowMs);
    case 'not-done':
      return !task.isDone && !isTaskSuspended(task, nowMs);
  }
}
