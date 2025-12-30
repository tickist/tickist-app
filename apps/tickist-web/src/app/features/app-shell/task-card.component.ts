import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import {
  Task,
  TaskDataService,
  TaskStep,
  TaskUpdateInput,
} from '../../data/task-data.service';
import { Project, ProjectDataService } from '../../data/project-data.service';
import { Tag, TagDataService } from '../../data/tag-data.service';
import { ComposerModalService } from '../task-fab/composer-modal.service';
import { ToastService } from '../../core/ui/toast.service';
import { LinkifyPipe } from '../../core/text/linkify.pipe';

type TaskViewMode = 'extended' | 'simple';
type RepeatMode =
  | 'never'
  | 'daily'
  | 'daily_work'
  | 'weekly'
  | 'monthly'
  | 'yearly';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [NgIf, NgFor, LinkifyPipe],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.css',
})
export class TaskCardComponent implements OnChanges {
  @Input({ required: true }) task!: Task;
  @Input() project: Project | null = null;
  @Input() viewMode: TaskViewMode = 'extended';

  private readonly tasks = inject(TaskDataService);
  private readonly tagsService = inject(TagDataService);
  private readonly projectsService = inject(ProjectDataService);
  private readonly composer = inject(ComposerModalService);
  private readonly toasts = inject(ToastService);

  readonly tagLookup = computed(() => {
    const map = new Map<string, Tag>();
    for (const tag of this.tagsService.list()) {
      map.set(tag.id, tag);
    }
    return map;
  });
  readonly projects = computed(() => this.projectsService.list());
  readonly descriptionOpen = signal(false);
  readonly tagsOpen = signal(false);
  readonly repeatOpen = signal(false);
  readonly stepsOpen = signal(false);
  readonly projectPickerOpen = signal(false);
  readonly menuOpen = signal(false);
  readonly descriptionDraft = signal('');
  readonly newStepDraft = signal('');
  readonly repeatOptions: { label: string; mode: RepeatMode }[] = [
    { label: 'Never', mode: 'never' },
    { label: 'Daily', mode: 'daily' },
    { label: 'Daily (workweek)', mode: 'daily_work' },
    { label: 'Weekly', mode: 'weekly' },
    { label: 'Monthly', mode: 'monthly' },
    { label: 'Yearly', mode: 'yearly' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task']) {
      const previous = changes['task'].previousValue as Task | undefined;
      const current = changes['task'].currentValue as Task | undefined;
      this.descriptionDraft.set(current?.description ?? '');
      this.newStepDraft.set('');
      if (previous?.id && current?.id && previous.id !== current.id) {
        this.menuOpen.set(false);
        this.closeAllPanels();
      }
    }
  }

  taskTimeLabel(): string | null {
    const estimateMinutes = this.task.estimateMinutes;
    const spentMinutes = this.task.spentMinutes;
    if (
      estimateMinutes == null ||
      estimateMinutes <= 0 ||
      spentMinutes == null ||
      spentMinutes <= 0
    ) {
      return null;
    }
    const estimate = this.formatDuration(estimateMinutes);
    const spent = this.formatDuration(spentMinutes);
    if (!estimate || !spent) {
      return null;
    }
    return `${estimate} / ${spent}`;
  }

  progressPercent(): number | null {
    if (
      this.task.estimateMinutes == null ||
      this.task.estimateMinutes <= 0 ||
      this.task.spentMinutes == null
    ) {
      return null;
    }
    const percent = (this.task.spentMinutes / this.task.estimateMinutes) * 100;
    return Math.min(100, Math.max(0, Math.round(percent)));
  }

  priorityColor(priority?: string | null): string {
    switch ((priority ?? '').trim().toUpperCase()) {
      case 'A':
        return '#ef4444'; // red
      case 'B':
        return '#fbbf24'; // amber
      case 'C':
        return '#22c55e'; // green
      default:
        return '#94a3b8'; // slate
    }
  }

  async toggleDone(isDone: boolean): Promise<void> {
    await this.mutateTask(
      { id: this.task.id, isDone },
      isDone ? 'Task marked done.' : 'Task reopened.',
      'Failed to update completion.'
    );
  }

  async togglePin(): Promise<void> {
    const next = !this.task.pinned;
    await this.mutateTask(
      { id: this.task.id, pinned: next },
      next ? 'Task pinned for quick access.' : 'Task unpinned.',
      'Failed to update pin state.'
    );
  }

  editTask(): void {
    this.composer.openTaskModal({ mode: 'edit', task: this.task });
  }

  async deleteTask(): Promise<void> {
    const confirmed = confirm(`Delete "${this.task.name}"?`);
    if (!confirmed) {
      return;
    }
    await this.runTaskAction(
      () => this.tasks.deleteTask(this.task.id),
      'Task deleted.',
      'Failed to delete task.'
    );
    this.menuOpen.set(false);
  }

  async setPriority(level: string): Promise<void> {
    await this.mutateTask(
      { id: this.task.id, priority: level },
      `Priority set to ${level}.`,
      'Failed to update priority.'
    );
    this.menuOpen.set(false);
  }

  async setTaskType(type: string): Promise<void> {
    await this.mutateTask(
      { id: this.task.id, taskType: type.toUpperCase() },
      'Task type updated.',
      'Failed to update task type.'
    );
    this.menuOpen.set(false);
  }

  async setDueToday(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.mutateTask(
      { id: this.task.id, finishDate: today.toISOString() },
      'Due today.',
      'Failed to update date.'
    );
    this.menuOpen.set(false);
  }

  async shiftDue(days: number): Promise<void> {
    const base = this.task.finishDate ? new Date(this.task.finishDate) : new Date();
    base.setDate(base.getDate() + days);
    await this.mutateTask(
      { id: this.task.id, finishDate: base.toISOString() },
      'Due date adjusted.',
      'Failed to update date.'
    );
    this.menuOpen.set(false);
  }

  async clearDue(): Promise<void> {
    await this.mutateTask(
      { id: this.task.id, finishDate: null, finishTime: null },
      'Due date cleared.',
      'Failed to clear due date.'
    );
    this.menuOpen.set(false);
  }

  toggleProjectPicker(): void {
    const next = !this.projectPickerOpen();
    this.closeAllPanels();
    if (next) {
      this.projectPickerOpen.set(true);
    }
  }

  async changeProject(projectId: string): Promise<void> {
    await this.mutateTask(
      { id: this.task.id, projectId: projectId || null },
      'Project updated.',
      'Failed to move task.'
    );
    this.projectPickerOpen.set(false);
  }

  toggleDescription(): void {
    const next = !this.descriptionOpen();
    this.closeAllPanels();
    this.descriptionOpen.set(next);
    if (next) {
      this.descriptionDraft.set(this.task.description ?? '');
    }
  }

  async saveDescription(): Promise<void> {
    await this.mutateTask(
      { id: this.task.id, description: this.descriptionDraft().trim() },
      'Description saved.',
      'Failed to save description.'
    );
  }

  tagName(tagId: string): string {
    return this.tagLookup().get(tagId)?.name ?? 'Tag';
  }

  addTag(tagId: string): void {
    if (!tagId) {
      return;
    }
    const next = Array.from(new Set([...this.task.tags, tagId]));
    void this.mutateTask(
      { id: this.task.id, tags: next },
      'Tag added.',
      'Failed to add tag.'
    );
  }

  addTagFromSelect(target: HTMLSelectElement | null): void {
    if (!target) {
      return;
    }
    const value = target.value;
    if (value) {
      this.addTag(value);
    }
    target.value = '';
  }

  removeTag(tagId: string): void {
    const next = this.task.tags.filter((id) => id !== tagId);
    void this.mutateTask(
      { id: this.task.id, tags: next },
      'Tag removed.',
      'Failed to remove tag.'
    );
  }

  availableTagsToAdd(): Tag[] {
    const taken = new Set(this.task.tags);
    return this.tagsService.list().filter((tag) => !taken.has(tag.id));
  }

  toggleTags(): void {
    const next = !this.tagsOpen();
    this.closeAllPanels();
    this.tagsOpen.set(next);
  }

  toggleRepeat(): void {
    const next = !this.repeatOpen();
    this.closeAllPanels();
    this.repeatOpen.set(next);
  }

  async setRepeatInterval(mode: RepeatMode): Promise<void> {
    const interval = this.getRepeatInterval(mode);
    await this.mutateTask(
      { id: this.task.id, repeatInterval: interval },
      'Repeat cadence updated.',
      'Failed to update repeat.'
    );
  }

  toggleSteps(): void {
    const next = !this.stepsOpen();
    this.closeAllPanels();
    this.stepsOpen.set(next);
  }

  toggleStep(step: TaskStep, done: boolean): void {
    const next = this.task.steps.map((existing) =>
      existing === step ? { ...existing, isDone: done } : existing
    );
    void this.persistSteps(next, 'Step updated.');
  }

  removeStep(step: TaskStep): void {
    const next = this.task.steps.filter((existing) => existing !== step);
    void this.persistSteps(next, 'Step removed.');
  }

  moveStep(step: TaskStep, direction: 'up' | 'down'): void {
    const current = [...this.task.steps];
    const index = current.indexOf(step);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= current.length) {
      return;
    }
    [current[index], current[target]] = [current[target], current[index]];
    void this.persistSteps(current, 'Steps reordered.');
  }

  addStep(): void {
    const content = this.newStepDraft().trim();
    if (!content) {
      return;
    }
    const next: TaskStep[] = [
      ...this.task.steps,
      {
        id: this.generateStepId(),
        taskId: this.task.id,
        content,
        isDone: false,
        position: this.task.steps.length,
      },
    ];
    void this.persistSteps(next, 'Step added.');
    this.newStepDraft.set('');
  }

  private async persistSteps(
    steps: TaskStep[],
    successMessage = 'Steps updated.'
  ): Promise<void> {
    await this.mutateTask(
      {
        id: this.task.id,
        steps: steps.map((step, index) => ({
          content: step.content,
          isDone: step.isDone,
          position: index,
        })),
      },
      successMessage,
      'Failed to update steps.'
    );
  }

  private async mutateTask(
    payload: TaskUpdateInput,
    successMessage: string,
    errorMessage = 'Unable to update task.'
  ): Promise<boolean> {
    try {
      const updated = await this.tasks.updateTask(payload);
      if (!updated) {
        throw new Error('Update returned null');
      }
      this.toasts.success(successMessage);
      return true;
    } catch (error) {
      console.error('[TaskCard] Task update failed', error);
      this.toasts.error(errorMessage);
      return false;
    }
  }

  private async runTaskAction(
    action: () => Promise<boolean>,
    successMessage: string,
    errorMessage = 'Unable to complete action.'
  ): Promise<boolean> {
    try {
      const result = await action();
      if (!result) {
        throw new Error('Action returned false');
      }
      this.toasts.success(successMessage);
      return true;
    } catch (error) {
      console.error('[TaskCard] Task action failed', error);
      this.toasts.error(errorMessage);
      return false;
    }
  }

  private formatDuration(minutes?: number | null): string | null {
    if (minutes == null) {
      return null;
    }
    if (minutes >= 60) {
      const hours = minutes / 60;
      return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
    }
    return `${minutes}m`;
  }

  private getRepeatInterval(mode: RepeatMode): number {
    switch (mode) {
      case 'never':
        return 0;
      case 'daily':
        return 1;
      case 'daily_work':
        return 1;
      case 'weekly':
        return 7;
      case 'monthly':
        return 30;
      case 'yearly':
        return 365;
      default:
        return this.task.repeatInterval ?? 0;
    }
  }

  currentRepeatMode(): RepeatMode {
    return this.deriveRepeatMode(this.task.repeatInterval).mode;
  }

  private deriveRepeatMode(
    interval: number | null | undefined
  ): { mode: RepeatMode } {
    if (!interval || interval <= 0) {
      return { mode: 'never' };
    }
    switch (interval) {
      case 1:
        return { mode: 'daily' };
      case 7:
        return { mode: 'weekly' };
      case 30:
        return { mode: 'monthly' };
      case 365:
        return { mode: 'yearly' };
      default:
        return { mode: 'daily' };
    }
  }

  private generateStepId(): string {
    const cryptoRef = globalThis.crypto;
    if (cryptoRef?.randomUUID) {
      return cryptoRef.randomUUID();
    }
    return `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private closeAllPanels(): void {
    this.projectPickerOpen.set(false);
    this.descriptionOpen.set(false);
    this.tagsOpen.set(false);
    this.repeatOpen.set(false);
    this.stepsOpen.set(false);
  }
}
