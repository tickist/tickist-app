import { z } from 'zod';
import { ProfileMetadataSchema } from '../../config/profile-metadata';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  Task,
  TaskCreateInput,
  TaskDataService,
  TaskUpdateInput,
} from '../../data/task-data.service';
import {
  TaskReminderDataService,
  TaskReminderDraft,
  isValidTaskReminderDraft,
} from '../../data/task-reminder-data.service';
import {
  Project,
  ProjectDataService,
  defaultTaskAssigneeIds,
  isProjectSharedWithOthers,
} from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { TaskComposerPreset } from './composer-modal.service';
import { ProjectPickerComponent } from '../../core/ui/project-picker.component';
import { ThemedSelectComponent } from '../../core/ui/themed-select.component';
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

type SuspensionMode = 'indefinite' | 'until';

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
  suspensionMode: SuspensionMode;
  suspendUntil: string;
  suspendUntilTime: string;
  pinned: boolean;
  estimateMinutes: number;
  spentMinutes: number;
};

@Component({
  selector: 'app-task-composer',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    ProjectPickerComponent,
    ThemedSelectComponent,
    SheetScaffoldComponent,
  ],
  templateUrl: './task-composer.component.html',
  styleUrl: './task-composer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskComposerComponent {
  readonly repeatUnitOptions = [
    { value: 'day', label: 'days' },
    { value: 'week', label: 'weeks' },
    { value: 'month', label: 'months' },
    { value: 'year', label: 'years' },
  ];
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskDataService);
  private readonly projectService = inject(ProjectDataService);
  private readonly tagService = inject(TagDataService);
  private readonly reminderService = inject(TaskReminderDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly session = inject(SupabaseSessionService);

  readonly projects = computed(() => this.projectService.list());
  readonly tags = computed(() => this.tagService.list());
  readonly user = computed(() => this.session.user());
  readonly inboxProjectId = computed(
    () => this.projects().find((project) => project.isInbox)?.id ?? ''
  );
  readonly activeTab = signal<TabKey>('general');
  readonly submitting = signal(false);
  readonly autoSaveStatus = signal<'saved' | 'pending' | 'saving' | 'error'>(
    'saved'
  );
  readonly autoSaveMessage = signal('Changes save automatically.');
  readonly remindersLoading = signal(false);
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
  readonly sheetTitle = computed(() => (this.editingTask() ? '' : 'New task'));
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

    for (const assignee of project.assignees ?? []) {
      options.set(assignee.userId, assignee.label);
    }

    if (!options.has(project.ownerId)) {
      options.set(project.ownerId, 'Project owner');
    }

    for (const member of project.members) {
      if (member.status !== 'accepted' || options.has(member.userId)) {
        continue;
      }

      options.set(member.userId, member.invitedEmail ?? 'Project member');
    }

    const currentUser = this.user();

    if (currentUser && options.has(currentUser.id)) {
      options.set(currentUser.id, this.currentUserLabel());
    }

    return Array.from(options, ([userId, label]) => ({ userId, label }));
  }

  assigneeSelectOptions() {
    return [
      { value: '', label: 'Unassigned' },
      ...this.assigneeOptions().map((assignee) => ({
        value: assignee.userId,
        label: assignee.label,
      })),
    ];
  }

  @Output() dismiss = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  readonly editingTask = signal<Task | null>(null);
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
    suspensionMode: 'indefinite',
    suspendUntil: '',
    suspendUntilTime: '00:00',
    pinned: false,
    estimateMinutes: 15,
    spentMinutes: 0,
  };
  @Input() set preset(value: TaskComposerPreset | null) {
    this.applyPreset(value);
  }

  readonly taskForm = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      priority: ['B'],
      projectId: [''],
      taskType: ['normal'],
      completeMode: ['by'],
      finishDate: [''],
      finishTime: [''],
      description: [''],
      repeatMode: this.fb.nonNullable.control<RepeatMode>('never'),
      repeatEvery: [1],
      repeatUnit: this.fb.nonNullable.control<RepeatUnit>('day'),
      repeatFrom:
        this.fb.nonNullable.control<RepeatFromMode>('completion_date'),
      tags: this.fb.nonNullable.control<string[]>([]),
      assigneeId: [''],
      isActive: [true],
      suspensionMode: this.fb.nonNullable.control<SuspensionMode>('indefinite'),
      suspendUntil: [''],
      suspendUntilTime: ['00:00'],
      pinned: [false],
      estimateMinutes: [15],
      spentMinutes: [0],
    },
    { validators: suspensionValidator }
  );

  readonly stepsArray = this.fb.array<FormGroup>([]);
  readonly remindersArray = this.fb.array<FormGroup>([]);
  private reminderLoadTaskId: string | null = null;
  private reminderEditVersion = 0;
  private reminderLoadPromise: Promise<void> | null = null;
  readonly remindersReady = signal(false);
  private hydrating = false;
  private pendingTaskSave = false;
  private pendingReminderSave = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private saveInProgress: Promise<boolean> | null = null;
  private savedTags: string[] = [];
  private savedAssigneeIds: string[] = [];
  private savedSteps: { content: string; isDone: boolean; position: number }[] =
    [];

  constructor() {
    this.taskForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.scheduleAutoSave('task'));
    this.steps.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.scheduleAutoSave('task'));
    this.reminders.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.scheduleAutoSave('reminders'));

    this.destroyRef.onDestroy(() => {
      if (this.saveTimer) clearTimeout(this.saveTimer);

      if (this.pendingTaskSave || this.pendingReminderSave) {
        void this.flushAutoSave();
      }
    });

    this.taskForm.controls.projectId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((projectId) => {
        if (this.editingTask()) {
          return;
        }

        this.taskForm.controls.assigneeId.setValue(
          this.defaultAssigneeId(projectId)
        );
      });

    effect(() => {
      if (!this.user()) {
        this.taskForm.disable({ emitEvent: false });
      } else {
        this.taskForm.enable({ emitEvent: false });
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
    if (preset?.mode === 'edit' && preset.task?.id === this.editingTask()?.id) {
      this.editingTask.set(preset.task);

      return;
    }

    this.hydrating = true;
    this.cancelScheduledSave();
    this.pendingTaskSave = false;
    this.pendingReminderSave = false;
    this.remindersReady.set(false);
    this.autoSaveStatus.set('saved');
    this.autoSaveMessage.set('Changes save automatically.');
    this.activeTab.set('general');

    if (!preset || preset.mode === 'create') {
      this.editingTask.set(null);
      this.reminderLoadTaskId = null;
      this.reminderLoadPromise = null;
      this.remindersLoading.set(false);
      this.reminderEditVersion += 1;
      this.clearReminders();
      this.resetForm({
        projectId: preset?.defaults?.projectId ?? this.inboxProjectId(),
        tags: preset?.defaults?.tags ?? [],
        priority: preset?.defaults?.priority ?? 'B',
      });
      this.hydrating = false;

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
        suspensionMode: task.suspendUntil ? 'until' : 'indefinite',
        suspendUntil: normalizeDateTimeDateValue(task.suspendUntil),
        suspendUntilTime: normalizeDateTimeTimeValue(task.suspendUntil),
        pinned: task.pinned,
        estimateMinutes: task.estimateMinutes ?? 15,
        spentMinutes: task.spentMinutes ?? 0,
      });
      this.clearSteps();
      task.steps.forEach((step) => this.addStep(step.content, step.isDone));
      this.savedTags = [...this.taskForm.controls.tags.value];
      this.savedAssigneeIds = this.taskForm.controls.assigneeId.value
        ? [this.taskForm.controls.assigneeId.value]
        : [];
      this.savedSteps = this.stepPayload();
      this.reminderEditVersion += 1;
      this.clearReminders();
      this.remindersLoading.set(true);
      this.hydrating = false;
      this.reminderLoadPromise = this.loadRemindersForTask(task.id);
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

    try {
      const reminders = await this.reminderService.listForTask(taskId);

      if (
        this.reminderLoadTaskId !== taskId ||
        this.reminderEditVersion !== editVersion
      ) {
        return;
      }

      this.hydrating = true;
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
      this.hydrating = false;
      this.remindersReady.set(true);
      this.remindersLoading.set(false);

      if (this.pendingReminderSave) {
        this.scheduleAutoSave('reminders');
      } else if (!this.pendingTaskSave && this.autoSaveStatus() === 'error') {
        this.autoSaveStatus.set('saved');
        this.autoSaveMessage.set('Changes save automatically.');
      }
    } catch {
      if (this.reminderLoadTaskId === taskId) {
        this.remindersLoading.set(false);
        this.autoSaveStatus.set('error');
        this.autoSaveMessage.set(
          'Could not load reminders. Retry before editing.'
        );
      }
    }
  }

  retryRemindersLoad(): void {
    const task = this.editingTask();

    if (!task || this.remindersLoading()) return;

    this.remindersLoading.set(true);
    this.reminderLoadPromise = this.loadRemindersForTask(task.id);
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

  private scheduleAutoSave(kind: 'task' | 'reminders'): void {
    if (this.hydrating || !this.editingTask()) return;

    if (kind === 'task') {
      this.pendingTaskSave = true;
    } else {
      this.pendingReminderSave = true;
    }

    this.autoSaveStatus.set('pending');
    this.autoSaveMessage.set('Saving changes…');
    this.cancelScheduledSave();
    this.saveTimer = setTimeout(() => void this.flushAutoSave(), 500);
  }

  private cancelScheduledSave(): void {
    if (!this.saveTimer) return;

    clearTimeout(this.saveTimer);
    this.saveTimer = null;
  }

  async flushAutoSave(): Promise<boolean> {
    this.cancelScheduledSave();

    if (this.saveInProgress) return this.saveInProgress;

    if (!this.pendingTaskSave && !this.pendingReminderSave) return true;

    this.saveInProgress = this.savePendingChanges();

    try {
      return await this.saveInProgress;
    } finally {
      this.saveInProgress = null;
    }
  }

  private async savePendingChanges(): Promise<boolean> {
    while (this.pendingTaskSave || this.pendingReminderSave) {
      const editing = this.editingTask();

      if (!editing || !this.user()) return false;

      const saveTask = this.pendingTaskSave;
      const saveReminders = this.pendingReminderSave;
      this.pendingTaskSave = false;
      this.pendingReminderSave = false;
      this.autoSaveStatus.set('saving');
      this.autoSaveMessage.set('Saving changes…');

      let errorMessage = '';

      if (saveTask) {
        if (this.taskForm.invalid) {
          this.pendingTaskSave = true;
          errorMessage = 'Complete the required task fields to save changes.';
        } else {
          try {
            const payload = this.buildTaskUpdatePayload(editing.id);
            const updated = await this.taskService.updateTask(payload);

            if (!updated) throw new Error('Task update failed.');

            if (this.editingTask()?.id !== editing.id) return false;

            this.editingTask.set(updated);

            if (payload.tags) this.savedTags = [...payload.tags];

            if (payload.assigneeIds) {
              this.savedAssigneeIds = [...payload.assigneeIds];
            }

            if (payload.steps) {
              this.savedSteps = payload.steps.map((step, index) => ({
                content: step.content,
                isDone: !!step.isDone,
                position: step.position ?? index,
              }));
            }
          } catch {
            this.pendingTaskSave = true;
            errorMessage = 'Could not save task changes. Retry the save.';
          }
        }
      }

      if (saveReminders) {
        if (this.editingTask()?.id !== editing.id) return false;

        if (this.reminderLoadPromise) await this.reminderLoadPromise;

        if (this.editingTask()?.id !== editing.id) return false;

        if (!this.remindersReady()) {
          this.pendingReminderSave = true;
          errorMessage = 'Could not load reminders. Retry before editing.';
        } else {
          const drafts = this.validReminderDrafts();

          if (!drafts) {
            this.pendingReminderSave = true;
            errorMessage = 'Complete each reminder date and time to save.';
          } else {
            try {
              await this.reminderService.saveForTask(
                editing.id,
                editing.ownerId,
                drafts
              );
              await this.taskService.refresh();

              if (this.editingTask()?.id !== editing.id) return false;
            } catch {
              this.pendingReminderSave = true;
              errorMessage = 'Could not save reminders. Retry the save.';
            }
          }
        }
      }

      if (errorMessage) {
        this.autoSaveStatus.set('error');
        this.autoSaveMessage.set(errorMessage);

        return false;
      }
    }

    this.autoSaveStatus.set('saved');
    this.autoSaveMessage.set('All changes saved.');

    return true;
  }

  private validReminderDrafts(): TaskReminderDraft[] | null {
    const drafts: TaskReminderDraft[] = [];

    for (const control of this.reminders.controls) {
      const raw = ReminderDraftSchema.parse(control.getRawValue());

      if (!raw.id && !raw.date && !raw.time) continue;

      const draft: TaskReminderDraft = {
        id: raw.id || null,
        date: raw.date ?? '',
        time: raw.time ?? '',
        timezone: raw.timezone ?? resolveBrowserTimezone(),
      };

      if (!isValidTaskReminderDraft(draft)) return null;

      if (!draft.id) {
        draft.id = crypto.randomUUID();
        control.get('id')?.setValue(draft.id, { emitEvent: false });
      }

      drafts.push(draft);
    }

    return drafts;
  }

  async requestClose(): Promise<void> {
    if (this.editingTask()) {
      if (this.reminderLoadPromise) await this.reminderLoadPromise;

      if (!(await this.flushAutoSave())) return;
    }

    this.dismiss.emit();
  }

  async retryAutoSave(): Promise<void> {
    if (!this.remindersReady()) {
      this.retryRemindersLoad();

      if (this.reminderLoadPromise) await this.reminderLoadPromise;
    }

    await this.flushAutoSave();
  }

  private stepPayload(): {
    content: string;
    isDone: boolean;
    position: number;
  }[] {
    return this.steps.controls.flatMap((control, position) => {
      const { content, isDone } = control.getRawValue();
      const trimmed = content?.trim();

      return trimmed ? [{ content: trimmed, isDone: !!isDone, position }] : [];
    });
  }

  private buildTaskUpdatePayload(id: string): TaskUpdateInput {
    const value = this.taskForm.getRawValue();

    const repeatInterval = this.getRepeatInterval(
      value.repeatMode,
      value.repeatEvery,
      value.repeatUnit
    );

    const assigneeIds = value.assigneeId ? [value.assigneeId] : [];
    const steps = this.stepPayload();

    const payload: TaskUpdateInput = {
      id,
      name: value.name,
      projectId: value.projectId || null,
      description: value.description ?? '',
      finishDate: value.finishDate || null,
      finishTime: value.finishTime || null,
      typeFinishDate: this.typeFinishDateFromMode(value.completeMode),
      priority: value.priority,
      taskType: value.taskType?.toUpperCase(),
      repeatInterval,
      fromRepeating: this.getRepeatFromValue(
        repeatInterval,
        value.repeatFrom,
        !!value.finishDate
      ),
      estimateMinutes: value.estimateMinutes ?? null,
      spentMinutes: value.spentMinutes ?? null,
      isActive: value.isActive,
      suspendUntil: this.resolveSuspendUntil(
        value.isActive,
        value.suspensionMode,
        value.suspendUntil,
        value.suspendUntilTime
      ),
      pinned: value.pinned,
    };

    if (JSON.stringify(value.tags) !== JSON.stringify(this.savedTags)) {
      payload.tags = [...value.tags];
    }

    if (JSON.stringify(assigneeIds) !== JSON.stringify(this.savedAssigneeIds)) {
      payload.assigneeIds = assigneeIds;
    }

    if (JSON.stringify(steps) !== JSON.stringify(this.savedSteps)) {
      payload.steps = steps;
    }

    return payload;
  }

  async submit(addAnother = false): Promise<void> {
    this.taskForm.updateValueAndValidity();

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
        value.repeatMode,
        value.repeatEvery,
        value.repeatUnit
      );

      const repeatFrom = this.getRepeatFromValue(
        repeatInterval,
        value.repeatFrom,
        !!value.finishDate
      );

      const suspendUntil = this.resolveSuspendUntil(
        value.isActive,
        value.suspensionMode,
        value.suspendUntil,
        value.suspendUntilTime
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
          suspendUntil,
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
        suspendUntil,
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
    const projectId = overrides?.projectId ?? this.defaultFormValue.projectId;

    const next: TaskFormDefaults = {
      ...this.defaultFormValue,
      ...overrides,
      assigneeId: overrides?.assigneeId ?? this.defaultAssigneeId(projectId),
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
      suspensionMode: next.suspensionMode,
      suspendUntil: next.suspendUntil,
      suspendUntilTime: next.suspendUntilTime,
      pinned: next.pinned,
      estimateMinutes: next.estimateMinutes,
      spentMinutes: next.spentMinutes,
    });
    this.clearSteps();
  }

  private reminderDrafts(): TaskReminderDraft[] {
    return this.reminders.controls.map((control) => {
      const raw = ReminderDraftSchema.parse(control.getRawValue());

      return {
        id: raw.id ?? null,
        date: raw.date ?? '',
        time: raw.time ?? '',
        timezone: raw.timezone ?? resolveBrowserTimezone(),
      };
    });
  }

  minimumSuspendDate(): string {
    return formatLocalDate(new Date());
  }

  private resolveSuspendUntil(
    isActive: boolean,
    mode: SuspensionMode,
    date: string,
    time: string
  ): string | null {
    if (isActive || mode === 'indefinite') {
      return null;
    }

    return new Date(localDateTime(date, time)).toISOString();
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

  private repeatModeFromInterval(
    interval: number | null | undefined
  ): RepeatState {
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

  private defaultAssigneeId(projectId: string): string {
    const currentUser = this.user();
    const project = this.projects().find((item) => item.id === projectId);

    return currentUser
      ? defaultTaskAssigneeIds(project, currentUser.id)[0] ?? ''
      : '';
  }

  private currentUserLabel(): string {
    const currentUser = this.user();

    const metadata = ProfileMetadataSchema.safeParse(
      currentUser?.user_metadata
    ).data;

    for (const key of ['full_name', 'name'] as const) {
      const value = metadata?.[key];

      if (value && value.trim()) {
        return value.trim();
      }
    }

    return currentUser?.email?.trim() || 'You';
  }

  private isSharedProject(project: Project): boolean {
    const currentUserId = this.user()?.id;

    return currentUserId
      ? isProjectSharedWithOthers(project, currentUserId)
      : false;
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

function normalizeDateTimeTimeValue(value: string | null | undefined): string {
  if (!value) {
    return '00:00';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '00:00';
  }

  const hours = `${parsed.getHours()}`.padStart(2, '0');
  const minutes = `${parsed.getMinutes()}`.padStart(2, '0');

  return `${hours}:${minutes}`;
}

function normalizeDateTimeDateValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? '' : formatLocalDate(parsed);
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function localDateTime(date: string, time: string): string {
  return `${date}T${time || '00:00'}`;
}

function suspensionValidator(
  control: AbstractControl
): ValidationErrors | null {
  const parsed = SuspensionValueSchema.safeParse(control.value);

  if (!parsed.success) return { invalidSuspension: true };

  const value = parsed.data;

  if (value.isActive || value.suspensionMode !== 'until') {
    return null;
  }

  const suspendUntilMs = value.suspendUntil
    ? new Date(
        localDateTime(value.suspendUntil, value.suspendUntilTime ?? '00:00')
      ).getTime()
    : Number.NaN;

  return Number.isNaN(suspendUntilMs) || suspendUntilMs <= Date.now()
    ? { invalidSuspension: true }
    : null;
}

function resolveBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function toReminderInputValue(value: string): ReminderInputValue {
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

interface RepeatState {
  mode: RepeatMode;
  every: number;
  unit: RepeatUnit;
}

interface ReminderInputValue {
  date: string;
  time: string;
}

const ReminderDraftSchema = z.object({
  id: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  timezone: z.string().optional(),
});

const SuspensionValueSchema = z.object({
  isActive: z.boolean().optional(),
  suspensionMode: z.enum(['indefinite', 'until']).optional(),
  suspendUntil: z.string().optional(),
  suspendUntilTime: z.string().optional(),
});
