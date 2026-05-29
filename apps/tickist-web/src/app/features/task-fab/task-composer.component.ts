import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  Task,
  TaskCreateInput,
  TaskDataService,
  TaskUpdateInput,
} from '../../data/task-data.service';
import {
  TaskReminderDataService,
  TaskReminderDraft,
} from '../../data/task-reminder-data.service';
import { ProjectDataService } from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { TaskComposerPreset } from './composer-modal.service';
import { ProjectPickerComponent } from '../../core/ui/project-picker.component';
import {
  SheetScaffoldComponent,
  SheetScaffoldTab,
} from '../../core/ui/sheet-scaffold.component';

type TabKey = 'general' | 'repeat' | 'reminders' | 'tags' | 'steps' | 'extra';
type RepeatMode =
  | 'never'
  | 'daily'
  | 'daily_work'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';
type RepeatUnit = 'day' | 'week' | 'month' | 'year';
type RepeatFromMode = 'completion_date' | 'due_date';

type TaskFormDefaults = {
  name: string;
  priority: string;
  projectId: string;
  taskType: string;
  completeMode: 'by' | 'on';
  finishDate: string;
  finishTime: string;
  description: string;
  repeatMode: RepeatMode;
  repeatEvery: number;
  repeatUnit: RepeatUnit;
  repeatFrom: RepeatFromMode;
  tags: string[];
  assigneeId: string;
  isActive: boolean;
  pinned: boolean;
  estimateMinutes: number;
  spentMinutes: number;
};

@Component({
  selector: 'app-task-composer',
  imports: [
    ReactiveFormsModule,
    ProjectPickerComponent,
    SheetScaffoldComponent,
  ],
  templateUrl: './task-composer.component.html',
  styleUrl: './task-composer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskComposerComponent {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskDataService);
  private readonly projectService = inject(ProjectDataService);
  private readonly tagService = inject(TagDataService);
  private readonly reminderService = inject(TaskReminderDataService);
  private readonly session = inject(SupabaseSessionService);

  readonly projects = computed(() => this.projectService.list());
  readonly tags = computed(() => this.tagService.list());
  readonly user = computed(() => this.session.user());
  readonly inboxProjectId = computed(
    () => this.projects().find((project) => project.isInbox)?.id ?? ''
  );
  readonly activeTab = signal<TabKey>('general');
  readonly submitting = signal(false);
  readonly tagSearch = signal('');
  readonly tabs: readonly SheetScaffoldTab<TabKey>[] = [
    { key: 'general', label: 'General', icon: '✏️' },
    { key: 'repeat', label: 'Repeat', icon: '🔁' },
    { key: 'reminders', label: 'Reminders', icon: '⏰' },
    { key: 'tags', label: 'Tags', icon: '🏷️' },
    { key: 'steps', label: 'Steps', icon: '☑️' },
    { key: 'extra', label: 'Extra', icon: '✨' },
  ];
  readonly sheetEyebrow = computed(() =>
    this.editingTask() ? 'Edit task' : 'Create task'
  );
  readonly sheetTitle = computed(() => this.editingTask()?.name || 'New task');
  readonly filteredTags = computed(() => {
    const query = this.tagSearch().trim().toLowerCase();
    return this.tags().filter((tag) => tag.name.toLowerCase().includes(query));
  });
  selectedProject() {
    const projectId = this.taskForm.controls.projectId.value;
    if (!projectId) {
      return null;
    }
    return this.projects().find((project) => project.id === projectId) ?? null;
  }

  assigneeOptions() {
    const project = this.selectedProject();
    if (!project || !this.isSharedProject(project)) {
      return [];
    }
    const options = new Map<string, string>();
    const ownerLabel =
      project.ownerId === this.user()?.id
        ? this.user()?.email ?? 'You'
        : 'Project owner';
    options.set(project.ownerId, ownerLabel);
    for (const member of project.members) {
      if (member.status !== 'accepted') {
        continue;
      }
      options.set(
        member.userId,
        member.invitedEmail ?? member.userId.slice(0, 8)
      );
    }
    return Array.from(options, ([userId, label]) => ({ userId, label }));
  }

  @Output() dismiss = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  readonly editingTask = signal<Task | null>(null);
  private currentPreset: TaskComposerPreset | null = null;
  private readonly defaultFormValue: TaskFormDefaults = {
    name: '',
    priority: 'B',
    projectId: '',
    taskType: 'normal',
    completeMode: 'by',
    finishDate: '',
    finishTime: '',
    description: '',
    repeatMode: 'never',
    repeatEvery: 1,
    repeatUnit: 'day',
    repeatFrom: 'completion_date',
    tags: [],
    assigneeId: '',
    isActive: true,
    pinned: false,
    estimateMinutes: 15,
    spentMinutes: 0,
  };
  @Input() set preset(value: TaskComposerPreset | null) {
    this.applyPreset(value);
  }

  readonly taskForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    priority: ['B'],
    projectId: [''],
    taskType: ['normal'],
    completeMode: ['by'],
    finishDate: [''],
    finishTime: [''],
    description: [''],
    repeatMode: ['never'],
    repeatEvery: [1],
    repeatUnit: ['day'],
    repeatFrom: ['completion_date'],
    tags: this.fb.nonNullable.control<string[]>([]),
    assigneeId: [''],
    isActive: [true],
    pinned: [false],
    estimateMinutes: [15],
    spentMinutes: [0],
  });

  readonly stepsArray = this.fb.array<FormGroup>([]);
  readonly remindersArray = this.fb.array<FormGroup>([]);
  private reminderLoadTaskId: string | null = null;
  private reminderEditVersion = 0;

  constructor() {
    effect(() => {
      if (!this.user()) {
        this.taskForm.disable();
      } else {
        this.taskForm.enable();
      }
    });

    effect(() => {
      if (this.editingTask()) {
        return;
      }
      const inboxId = this.inboxProjectId();
      if (!inboxId) {
        return;
      }
      if (!this.taskForm.controls.projectId.value) {
        this.taskForm.controls.projectId.setValue(inboxId);
      }
    });
  }

  private applyPreset(preset: TaskComposerPreset | null): void {
    this.currentPreset = preset;
    this.activeTab.set('general');
    if (!preset || preset.mode === 'create') {
      this.editingTask.set(null);
      this.reminderLoadTaskId = null;
      this.reminderEditVersion += 1;
      this.clearReminders();
      this.resetForm({
        projectId: preset?.defaults?.projectId ?? this.inboxProjectId(),
        tags: preset?.defaults?.tags ?? [],
        priority: preset?.defaults?.priority ?? 'B',
      });
      return;
    }

    if (preset.mode === 'edit' && preset.task) {
      const task = preset.task;
      this.editingTask.set(task);
      const { mode, every, unit } = this.repeatModeFromInterval(
        task.repeatInterval
      );
      this.resetForm({
        name: task.name,
        priority: (task.priority ?? 'B').toUpperCase(),
        projectId: task.projectId ?? '',
        taskType: task.taskType?.toLowerCase() ?? 'normal',
        completeMode: this.completeModeFromType(task.typeFinishDate),
        finishDate: normalizeDateInputValue(task.finishDate),
        finishTime: normalizeTimeInputValue(task.finishTime),
        description: task.description ?? '',
        repeatMode: mode,
        repeatEvery: every,
        repeatUnit: unit,
        repeatFrom: this.repeatFromModeFromValue(task.fromRepeating),
        tags: [...task.tags],
        assigneeId: task.assigneeIds?.[0] ?? '',
        isActive: task.isActive,
        pinned: task.pinned,
        estimateMinutes: task.estimateMinutes ?? 15,
        spentMinutes: task.spentMinutes ?? 0,
      });
      this.clearSteps();
      task.steps.forEach((step) => this.addStep(step.content, step.isDone));
      this.reminderEditVersion += 1;
      void this.loadRemindersForTask(task.id);
    }
  }

  get steps(): FormArray<FormGroup> {
    return this.stepsArray;
  }

  get reminders(): FormArray<FormGroup> {
    return this.remindersArray;
  }

  selectTab(tab: string): void {
    if (this.isTabKey(tab)) {
      this.activeTab.set(tab);
    }
  }

  toggleTag(tagId: string): void {
    const current = this.taskForm.controls.tags.value;
    if (current.includes(tagId)) {
      this.taskForm.controls.tags.setValue(
        current.filter((id) => id !== tagId)
      );
    } else {
      this.taskForm.controls.tags.setValue([...current, tagId]);
    }
  }

  addStep(initialValue = '', isDone = false): void {
    this.steps.push(
      this.fb.nonNullable.group({
        content: [initialValue, Validators.required],
        isDone: [isDone],
      })
    );
  }

  addReminder(
    date = '',
    time = '',
    id = '',
    timezone = resolveBrowserTimezone()
  ): void {
    this.reminderEditVersion += 1;
    this.addReminderControl(date, time, id, timezone);
  }

  private addReminderControl(
    date = '',
    time = '',
    id = '',
    timezone = resolveBrowserTimezone()
  ): void {
    this.reminders.push(
      this.fb.nonNullable.group({
        id: [id],
        date: [date],
        time: [time],
        timezone: [timezone],
      })
    );
  }

  removeReminder(index: number): void {
    this.reminderEditVersion += 1;
    this.reminders.removeAt(index);
  }

  removeStep(index: number): void {
    this.steps.removeAt(index);
  }

  moveStep(index: number, direction: 'up' | 'down'): void {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= this.steps.length) {
      return;
    }
    const sourceValue = this.steps.at(index).value;
    const targetValue = this.steps.at(target).value;
    this.steps.at(index).setValue(targetValue);
    this.steps.at(target).setValue(sourceValue);
  }

  private isTabKey(tab: string): tab is TabKey {
    return this.tabs.some((candidate) => candidate.key === tab);
  }

  private clearSteps(): void {
    while (this.steps.length) {
      this.steps.removeAt(0);
    }
  }

  private clearReminders(): void {
    while (this.reminders.length) {
      this.reminders.removeAt(0);
    }
  }

  private async loadRemindersForTask(taskId: string): Promise<void> {
    this.reminderLoadTaskId = taskId;
    const editVersion = this.reminderEditVersion;
    const reminders = await this.reminderService.listForTask(taskId);
    if (
      this.reminderLoadTaskId !== taskId ||
      this.reminderEditVersion !== editVersion
    ) {
      return;
    }
    this.clearReminders();
    reminders.forEach((reminder) => {
      const inputValue = toReminderInputValue(reminder.remindAt);
      this.addReminderControl(
        inputValue.date,
        inputValue.time,
        reminder.id,
        reminder.timezone
      );
    });
  }

  async createTag(name: string): Promise<void> {
    const trimmed = name.trim();
    const owner = this.user();
    if (!trimmed || !owner) {
      return;
    }
    const created = await this.tagService.createTag({
      ownerId: owner.id,
      name: trimmed,
    });
    if (created) {
      this.taskForm.controls.tags.setValue([
        ...this.taskForm.controls.tags.value,
        created.id,
      ]);
    }
    this.tagSearch.set('');
  }

  async submit(addAnother = false): Promise<void> {
    if (this.taskForm.invalid || !this.user()) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      const value = this.taskForm.getRawValue();
      const owner = this.user();
      if (!owner) {
        return;
      }
      const repeatInterval = this.getRepeatInterval(
        value.repeatMode as RepeatMode,
        value.repeatEvery,
        value.repeatUnit as RepeatUnit
      );
      const repeatFrom = this.getRepeatFromValue(
        repeatInterval,
        value.repeatFrom as RepeatFromMode,
        !!value.finishDate
      );
      const stepsPayload = this.steps.controls
        .map((control, index) => {
          const { content, isDone } = control.getRawValue();
          const trimmed = content?.trim();
          if (!trimmed) {
            return null;
          }
          return {
            content: trimmed,
            isDone: !!isDone,
            position: index,
          };
        })
        .filter(
          (
            step
          ): step is { content: string; isDone: boolean; position: number } =>
            !!step
        );
      const editing = this.editingTask();

      if (editing) {
        const updatePayload: TaskUpdateInput = {
          id: editing.id,
          name: value.name,
          projectId: value.projectId || null,
          description: value.description ?? '',
          finishDate: value.finishDate || null,
          finishTime: value.finishTime || null,
          typeFinishDate: this.typeFinishDateFromMode(value.completeMode),
          priority: value.priority,
          taskType: value.taskType?.toUpperCase(),
          repeatInterval,
          fromRepeating: repeatFrom,
          estimateMinutes: value.estimateMinutes ?? null,
          spentMinutes: value.spentMinutes ?? null,
          tags: value.tags,
          assigneeIds: value.assigneeId ? [value.assigneeId] : [],
          isActive: value.isActive,
          pinned: value.pinned,
          steps: stepsPayload,
        };
        const updated = await this.taskService.updateTask(updatePayload);
        if (updated) {
          await this.reminderService.saveForTask(
            updated.id,
            updated.ownerId,
            this.reminderDrafts()
          );
          await this.taskService.refresh();
          this.created.emit();
        }
        return;
      }

      const payload: TaskCreateInput = {
        ownerId: owner.id,
        name: value.name,
        projectId: value.projectId || this.inboxProjectId() || null,
        description: value.description ?? '',
        finishDate: value.finishDate || null,
        finishTime: value.finishTime || null,
        typeFinishDate: this.typeFinishDateFromMode(value.completeMode),
        priority: value.priority,
        taskType: value.taskType?.toUpperCase(),
        repeatInterval,
        fromRepeating: repeatFrom,
        estimateMinutes: value.estimateMinutes ?? null,
        spentMinutes: value.spentMinutes ?? null,
        tags: value.tags,
        assigneeIds: value.assigneeId ? [value.assigneeId] : [],
        isActive: value.isActive,
        pinned: value.pinned,
        steps: stepsPayload,
      };

      const created = await this.taskService.createTask(payload);
      if (created) {
        await this.reminderService.saveForTask(
          created.id,
          created.ownerId,
          this.reminderDrafts()
        );
        await this.taskService.refresh();
        if (addAnother) {
          this.resetForm({
            projectId: value.projectId,
            tags: value.tags,
          });
          this.clearReminders();
        } else {
          this.created.emit();
        }
      }
    } finally {
      this.submitting.set(false);
    }
  }

  private resetForm(overrides?: Partial<TaskFormDefaults>): void {
    const next: TaskFormDefaults = {
      ...this.defaultFormValue,
      ...overrides,
      tags: [...(overrides?.tags ?? this.defaultFormValue.tags)],
    };
    this.taskForm.reset({
      name: next.name,
      priority: next.priority,
      projectId: next.projectId,
      taskType: next.taskType,
      completeMode: next.completeMode,
      finishDate: next.finishDate,
      finishTime: next.finishTime,
      description: next.description,
      repeatMode: next.repeatMode,
      repeatEvery: next.repeatEvery,
      repeatUnit: next.repeatUnit,
      repeatFrom: next.repeatFrom,
      tags: next.tags,
      assigneeId: next.assigneeId,
      isActive: next.isActive,
      pinned: next.pinned,
      estimateMinutes: next.estimateMinutes,
      spentMinutes: next.spentMinutes,
    });
    this.clearSteps();
  }

  private reminderDrafts(): TaskReminderDraft[] {
    return this.reminders.controls.map((control) => {
      const raw = control.getRawValue() as {
        id?: string;
        date?: string;
        time?: string;
        timezone?: string;
      };
      return {
        id: raw.id ?? null,
        date: raw.date ?? '',
        time: raw.time ?? '',
        timezone: raw.timezone ?? resolveBrowserTimezone(),
      };
    });
  }

  private getRepeatInterval(
    mode: RepeatMode,
    every: number,
    unit: RepeatUnit
  ): number {
    switch (mode) {
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
      case 'custom':
        return Math.max(1, Math.round(every)) * this.repeatUnitMultiplier(unit);
      default:
        return 0;
    }
  }

  private getRepeatFromValue(
    repeatInterval: number,
    mode: RepeatFromMode,
    hasDueDate: boolean
  ): number | null {
    if (repeatInterval <= 0) {
      return null;
    }
    if (mode === 'due_date' && hasDueDate) {
      return 1;
    }
    return 0;
  }

  private repeatModeFromInterval(interval: number | null | undefined): {
    mode: RepeatMode;
    every: number;
    unit: RepeatUnit;
  } {
    if (!interval || interval <= 0) {
      return { mode: 'never', every: 1, unit: 'day' };
    }
    switch (interval) {
      case 1:
        return { mode: 'daily', every: 1, unit: 'day' };
      case 7:
        return { mode: 'weekly', every: 1, unit: 'week' };
      case 30:
        return { mode: 'monthly', every: 1, unit: 'month' };
      case 365:
        return { mode: 'yearly', every: 1, unit: 'year' };
    }
    const unit = this.repeatUnitFromInterval(interval);
    const every = Math.max(
      1,
      Math.round(interval / this.repeatUnitMultiplier(unit))
    );
    return { mode: 'custom', every, unit };
  }

  private repeatUnitMultiplier(unit: RepeatUnit): number {
    switch (unit) {
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'year':
        return 365;
      default:
        return 1;
    }
  }

  private repeatUnitFromInterval(interval: number): RepeatUnit {
    if (interval % 365 === 0) {
      return 'year';
    }
    if (interval % 30 === 0) {
      return 'month';
    }
    if (interval % 7 === 0) {
      return 'week';
    }
    return 'day';
  }

  private repeatFromModeFromValue(
    fromRepeating: number | null | undefined
  ): RepeatFromMode {
    return fromRepeating === 1 ? 'due_date' : 'completion_date';
  }

  private completeModeFromType(
    typeFinishDate: number | null | undefined
  ): 'by' | 'on' {
    return typeFinishDate === 0 ? 'on' : 'by';
  }

  private typeFinishDateFromMode(mode: string | null | undefined): number {
    return mode === 'on' ? 0 : 1;
  }

  private isSharedProject(project: { ownerId: string; members: unknown[] }) {
    return project.members.length > 0 || project.ownerId !== this.user()?.id;
  }
}

function normalizeDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const trimmed = value.trim();
  const dateOnlyMatch = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (dateOnlyMatch) {
    return dateOnlyMatch[1];
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsed.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeTimeInputValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const trimmed = value.trim();
  const timeMatch = /^(\d{2}:\d{2})/.exec(trimmed);
  return timeMatch ? timeMatch[1] : '';
}

function resolveBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function toReminderInputValue(value: string): { date: string; time: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: '', time: '' };
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}
