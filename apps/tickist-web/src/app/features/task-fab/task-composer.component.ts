import {
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
import { ProjectDataService } from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { TaskComposerPreset } from './composer-modal.service';
import { ProjectPickerComponent } from '../../core/ui/project-picker.component';

type TabKey = 'general' | 'repeat' | 'tags' | 'steps' | 'extra';
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
  isActive: boolean;
  pinned: boolean;
  estimateMinutes: number;
  spentMinutes: number;
};

@Component({
  selector: 'app-task-composer',
  standalone: true,
  imports: [ReactiveFormsModule, ProjectPickerComponent],
  templateUrl: './task-composer.component.html',
  styleUrl: './task-composer.component.css',
})
export class TaskComposerComponent {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskDataService);
  private readonly projectService = inject(ProjectDataService);
  private readonly tagService = inject(TagDataService);
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
  readonly filteredTags = computed(() => {
    const query = this.tagSearch().trim().toLowerCase();
    return this.tags().filter((tag) => tag.name.toLowerCase().includes(query));
  });

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
    isActive: [true],
    pinned: [false],
    estimateMinutes: [15],
    spentMinutes: [0],
  });

  readonly stepsArray = this.fb.array<FormGroup>([]);

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
        finishDate: task.finishDate ?? '',
        finishTime: task.finishTime ?? '',
        description: task.description ?? '',
        repeatMode: mode,
        repeatEvery: every,
        repeatUnit: unit,
        repeatFrom: this.repeatFromModeFromValue(task.fromRepeating),
        tags: [...task.tags],
        isActive: task.isActive,
        pinned: task.pinned,
        estimateMinutes: task.estimateMinutes ?? 15,
        spentMinutes: task.spentMinutes ?? 0,
      });
      this.clearSteps();
      task.steps.forEach((step) => this.addStep(step.content, step.isDone));
    }
  }

  get steps(): FormArray<FormGroup> {
    return this.stepsArray;
  }

  selectTab(tab: TabKey): void {
    this.activeTab.set(tab);
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

  private clearSteps(): void {
    while (this.steps.length) {
      this.steps.removeAt(0);
    }
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
          isActive: value.isActive,
          pinned: value.pinned,
          steps: stepsPayload,
        };
        const updated = await this.taskService.updateTask(updatePayload);
        if (updated) {
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
        isActive: value.isActive,
        pinned: value.pinned,
        steps: stepsPayload,
      };

      const created = await this.taskService.createTask(payload);
      if (created) {
        if (addAnother) {
          this.resetForm({
            projectId: value.projectId,
            tags: value.tags,
          });
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
      isActive: next.isActive,
      pinned: next.pinned,
      estimateMinutes: next.estimateMinutes,
      spentMinutes: next.spentMinutes,
    });
    this.clearSteps();
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
}
