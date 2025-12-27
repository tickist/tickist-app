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
import { NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
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

type TabKey = 'general' | 'repeat' | 'tags' | 'steps' | 'extra';
type RepeatMode =
  | 'never'
  | 'daily'
  | 'daily_work'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

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
  tags: string[];
  isActive: boolean;
  pinned: boolean;
  estimateMinutes: number;
  spentMinutes: number;
};

@Component({
  selector: 'app-task-composer',
  standalone: true,
  imports: [NgIf, NgFor, NgSwitch, NgSwitchCase, ReactiveFormsModule],
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
  readonly activeTab = signal<TabKey>('general');
  readonly submitting = signal(false);
  readonly tagSearch = signal('');
  readonly filteredTags = computed(() => {
    const query = this.tagSearch().trim().toLowerCase();
    return this.tags().filter((tag) =>
      tag.name.toLowerCase().includes(query)
    );
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
  }

  private applyPreset(preset: TaskComposerPreset | null): void {
    this.currentPreset = preset;
    this.activeTab.set('general');
    if (!preset || preset.mode === 'create') {
      this.editingTask.set(null);
      this.resetForm({
        projectId: preset?.defaults?.projectId ?? '',
        tags: preset?.defaults?.tags ?? [],
        priority: preset?.defaults?.priority ?? 'B',
      });
      return;
    }

    if (preset.mode === 'edit' && preset.task) {
      const task = preset.task;
      this.editingTask.set(task);
      const { mode, every } = this.repeatModeFromInterval(
        task.repeatInterval
      );
      this.resetForm({
        name: task.name,
        priority: (task.priority ?? 'B').toUpperCase(),
        projectId: task.projectId ?? '',
        taskType: task.taskType?.toLowerCase() ?? 'normal',
        completeMode: task.finishDate ? 'by' : 'on',
        finishDate: task.finishDate ?? '',
        finishTime: task.finishTime ?? '',
        description: task.description ?? '',
        repeatMode: mode,
        repeatEvery: every,
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
        value.repeatEvery
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
          (step): step is { content: string; isDone: boolean; position: number } =>
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
          priority: value.priority,
          taskType: value.taskType?.toUpperCase(),
          repeatInterval,
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
        projectId: value.projectId || null,
        description: value.description ?? '',
        finishDate: value.finishDate || null,
        finishTime: value.finishTime || null,
        priority: value.priority,
        taskType: value.taskType?.toUpperCase(),
        repeatInterval,
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
      tags: next.tags,
      isActive: next.isActive,
      pinned: next.pinned,
      estimateMinutes: next.estimateMinutes,
      spentMinutes: next.spentMinutes,
    });
    this.clearSteps();
  }

  private getRepeatInterval(mode: RepeatMode, every: number): number {
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
        return Math.max(1, every);
      default:
        return 0;
    }
  }

  private repeatModeFromInterval(
    interval: number | null | undefined
  ): { mode: RepeatMode; every: number } {
    if (!interval || interval <= 0) {
      return { mode: 'never', every: 1 };
    }
    switch (interval) {
      case 1:
        return { mode: 'daily', every: 1 };
      case 7:
        return { mode: 'weekly', every: 1 };
      case 30:
        return { mode: 'monthly', every: 1 };
      case 365:
        return { mode: 'yearly', every: 1 };
      default:
        return { mode: 'custom', every: interval };
    }
  }
}
