import {
  Component,
  EventEmitter,
  inject,
  Output,
  signal,
  computed,
  effect,
  Input,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import {
  Project,
  ProjectDataService,
} from '../../data/project-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { ProjectComposerPreset } from './composer-modal.service';

type ProjectTab = 'general' | 'extra' | 'sharing' | 'branding';

@Component({
  selector: 'app-project-composer',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
  templateUrl: './project-composer.component.html',
  styleUrl: './project-composer.component.css',
})
export class ProjectComposerComponent {
  private readonly fb = inject(FormBuilder);
  private readonly projects = inject(ProjectDataService);
  private readonly session = inject(SupabaseSessionService);
  private currentPreset: ProjectComposerPreset | null = null;

  readonly user = computed(() => this.session.user());
  readonly submitting = signal(false);
  readonly activeTab = signal<ProjectTab>('general');
  readonly inviteInput = signal('');
  readonly invites = signal<string[]>([]);
  readonly editingProject = signal<Project | null>(null);
  readonly projectOptions = computed(() =>
    this.projects.list().sort((a, b) => a.name.localeCompare(b.name))
  );
  readonly colors = [
    '#1D4ED8',
    '#0EA5E9',
    '#7C3AED',
    '#EC4899',
    '#F97316',
    '#FACC15',
    '#22C55E',
    '#14B8A6',
    '#475569',
    '#94A3B8',
  ];
  readonly iconOptions = [
    'folder',
    'calendar',
    'inbox',
    'lightbulb',
    'flag',
    'target',
    'rocket',
    'shield',
    'star',
    'gear',
  ];

  @Output() dismiss = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  @Input() set preset(value: ProjectComposerPreset | null) {
    this.applyPreset(value);
  }

  private readonly defaultFormState = {
    name: '',
    description: '',
    projectType: 'active',
    ancestorId: '',
    isActive: true,
    color: '#1D4ED8',
    icon: 'folder',
    defaultPriority: 'B',
    defaultDueMode: 'by',
    defaultDueDate: '',
    taskView: 'extended',
    dialogTime: false,
  };

  readonly form = this.fb.nonNullable.group({
    name: [this.defaultFormState.name, [Validators.required, Validators.minLength(3)]],
    description: [this.defaultFormState.description],
    projectType: [this.defaultFormState.projectType],
    ancestorId: [this.defaultFormState.ancestorId],
    isActive: [this.defaultFormState.isActive],
    color: [this.defaultFormState.color],
    icon: [this.defaultFormState.icon],
    defaultPriority: [this.defaultFormState.defaultPriority],
    defaultDueMode: [this.defaultFormState.defaultDueMode],
    defaultDueDate: [this.defaultFormState.defaultDueDate],
    taskView: [this.defaultFormState.taskView],
    dialogTime: [this.defaultFormState.dialogTime],
  });

  constructor() {
    effect(() => {
      if (!this.user()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });
  }

  selectTab(tab: ProjectTab): void {
    this.activeTab.set(tab);
  }

  removeInvite(email: string): void {
    this.invites.set(this.invites().filter((value) => value !== email));
  }

  addInvite(): void {
    const input = this.inviteInput().trim();
    if (input && !this.invites().includes(input)) {
      this.invites.set([...this.invites(), input]);
    }
    this.inviteInput.set('');
  }

  chooseColor(color: string): void {
    this.form.controls.color.setValue(color);
  }

  chooseIcon(icon: string): void {
    this.form.controls.icon.setValue(icon);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.user()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    try {
      const editing = this.editingProject();
      if (editing) {
        await this.projects.updateProject({
          id: editing.id,
          name: this.form.value.name ?? editing.name,
          description: this.form.value.description ?? '',
          projectType: this.form.value.projectType ?? 'active',
          ancestorId: this.form.value.ancestorId || null,
          isActive: this.form.value.isActive ?? true,
          color: this.form.value.color ?? '#1D4ED8',
          icon: this.form.value.icon ?? 'folder',
          defaultPriority: this.form.value.defaultPriority ?? 'B',
          defaultFinishDate: this.parseDefaultFinishDate(
            this.form.value.defaultDueDate
          ),
          defaultTypeFinishDate:
            this.form.value.defaultDueMode === 'by' ? 0 : 1,
          taskView: this.form.value.taskView ?? 'extended',
          dialogTimeWhenTaskFinished: this.form.value.dialogTime ?? false,
        });
      } else {
        await this.projects.createProject({
          ownerId: this.user()!.id,
          name: this.form.value.name ?? '',
          description: this.form.value.description ?? '',
          projectType: this.form.value.projectType ?? 'active',
          ancestorId: this.form.value.ancestorId || null,
          isActive: this.form.value.isActive ?? true,
          color: this.form.value.color ?? '#1D4ED8',
          icon: this.form.value.icon ?? 'folder',
          defaultPriority: this.form.value.defaultPriority ?? 'B',
          defaultFinishDate: this.parseDefaultFinishDate(
            this.form.value.defaultDueDate
          ),
          defaultTypeFinishDate:
            this.form.value.defaultDueMode === 'by' ? 0 : 1,
          taskView: this.form.value.taskView ?? 'extended',
          dialogTimeWhenTaskFinished: this.form.value.dialogTime ?? false,
          shareInvites: this.invites(),
        });
      }
      this.created.emit();
    } finally {
      this.submitting.set(false);
    }
  }

  private parseDefaultFinishDate(
    raw: string | null | undefined
  ): number | null {
    if (!raw) {
      return null;
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    // Normalize to whole days so the smallint column only stores offsets.
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    parsed.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (parsed.getTime() - base.getTime()) / 86_400_000
    );
    // Clamp to the Postgres smallint bounds.
    return Math.max(Math.min(diffDays, 32_767), -32_768);
  }

  private applyPreset(preset: ProjectComposerPreset | null): void {
    this.currentPreset = preset;
    this.inviteInput.set('');
    this.invites.set([]);
    this.activeTab.set('general');

    if (!preset) {
      this.editingProject.set(null);
      this.resetForm();
      return;
    }

    if (preset.mode === 'edit' && preset.project) {
      const project = preset.project;
      this.editingProject.set(project);
      this.resetForm({
        name: project.name,
        description: project.description ?? '',
        projectType: project.projectType ?? 'active',
        ancestorId: project.ancestorId ?? '',
        isActive: project.isActive,
        color: project.color ?? '#1D4ED8',
        icon: project.icon ?? 'folder',
        defaultPriority: project.defaultPriority ?? 'B',
        defaultDueMode: project.defaultTypeFinishDate === 0 ? 'by' : 'on',
        defaultDueDate: '',
        taskView: project.taskView ?? 'extended',
        dialogTime: project.dialogTimeWhenTaskFinished ?? false,
      });
      return;
    }

    this.editingProject.set(null);
    this.resetForm({
      projectType: preset.defaults?.projectType ?? this.defaultFormState.projectType,
      ancestorId: preset.defaults?.ancestorId ?? this.defaultFormState.ancestorId,
      color: preset.defaults?.color ?? this.defaultFormState.color,
      icon: preset.defaults?.icon ?? this.defaultFormState.icon,
    });
  }

  private resetForm(
    overrides?: Partial<typeof this.defaultFormState>
  ): void {
    this.form.reset({
      ...this.defaultFormState,
      ...overrides,
    });
  }
}
