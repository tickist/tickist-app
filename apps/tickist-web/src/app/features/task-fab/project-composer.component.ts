import {
  ChangeDetectionStrategy,
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

import { Project, ProjectDataService } from '../../data/project-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { ProjectComposerPreset } from './composer-modal.service';
import {
  PROJECT_ICON_OPTIONS,
  ProjectIconKey,
  resolveProjectIconKey,
} from '../../core/icons/project-icons';
import {
  buildHierarchy,
  collectDescendantIds,
} from '../../core/projects/project-tree';
import { ProjectPickerComponent } from '../../core/ui/project-picker.component';
import { ProjectIconComponent } from '../../core/ui/project-icon.component';
import {
  SheetScaffoldComponent,
  SheetScaffoldTab,
} from '../../core/ui/sheet-scaffold.component';

type ProjectTab = 'general' | 'extra' | 'sharing' | 'branding';

@Component({
  selector: 'app-project-composer',
  imports: [
    ReactiveFormsModule,
    ProjectPickerComponent,
    ProjectIconComponent,
    SheetScaffoldComponent,
  ],
  templateUrl: './project-composer.component.html',
  styleUrl: './project-composer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectComposerComponent {
  private readonly fb = inject(FormBuilder);
  private readonly projects = inject(ProjectDataService);
  private readonly session = inject(SupabaseSessionService);
  private currentPreset: ProjectComposerPreset | null = null;

  readonly user = computed(() => this.session.user());
  readonly submitting = signal(false);
  readonly inviteSubmitting = signal(false);
  readonly inviteFeedback = signal<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);
  readonly activeTab = signal<ProjectTab>('general');
  readonly tabs: readonly SheetScaffoldTab<ProjectTab>[] = [
    { key: 'general', label: 'General', icon: '✏️' },
    { key: 'extra', label: 'Extra', icon: '⚙️' },
    { key: 'sharing', label: 'Sharing', icon: '🤝' },
    { key: 'branding', label: 'Branding', icon: '🎨' },
  ];
  readonly sheetEyebrow = computed(() =>
    this.editingProject() ? 'Edit project' : 'Create project'
  );
  readonly sheetTitle = computed(
    () => this.editingProject()?.name || 'New project'
  );
  readonly inviteInput = signal('');
  readonly invites = signal<string[]>([]);
  readonly editingProject = signal<Project | null>(null);
  readonly projectOptions = computed(() =>
    [...this.projects.list()].sort((a, b) => a.name.localeCompare(b.name))
  );
  readonly availableAncestorOptions = computed(() => {
    const editingProjectId = this.editingProject()?.id ?? null;
    const projectTree = buildHierarchy(this.projectOptions());
    const descendantIds = editingProjectId
      ? collectDescendantIds(projectTree, editingProjectId)
      : new Set<string>();

    return this.projectOptions().filter((project) => {
      if (project.isInbox) {
        return false;
      }
      if (!editingProjectId) {
        return true;
      }
      return project.id !== editingProjectId && !descendantIds.has(project.id);
    });
  });
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
  readonly iconOptions = PROJECT_ICON_OPTIONS;

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
    name: [
      this.defaultFormState.name,
      [Validators.required, Validators.minLength(3)],
    ],
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

  selectTab(tab: string): void {
    if (this.isProjectTab(tab)) {
      this.activeTab.set(tab);
    }
  }

  removeInvite(email: string): void {
    this.invites.set(this.invites().filter((value) => value !== email));
  }

  async addInvite(): Promise<void> {
    const input = this.inviteInput().trim();
    if (!input) {
      return;
    }
    const editing = this.editingProject();
    if (!editing) {
      if (!this.invites().includes(input)) {
        this.invites.set([...this.invites(), input]);
      }
      this.inviteInput.set('');
      this.inviteFeedback.set({
        type: 'info',
        message: 'Invite will be sent after the project is saved.',
      });
      return;
    }
    this.inviteSubmitting.set(true);
    this.inviteFeedback.set(null);
    try {
      const result = await this.projects.inviteByEmail(editing.id, input);
      if (!result) {
        this.inviteFeedback.set({
          type: 'error',
          message: 'Invite could not be sent right now.',
        });
        return;
      }
      if (result.ok === false) {
        this.inviteFeedback.set({
          type: 'error',
          message: result.message,
        });
        return;
      }
      this.inviteFeedback.set({
        type: result.code === 'already_member' ? 'info' : 'success',
        message:
          result.code === 'already_member'
            ? 'This person already has access.'
            : 'Invite sent.',
      });
      this.editingProject.set(
        this.projects.list().find((project) => project.id === editing.id) ??
          editing
      );
      this.inviteInput.set('');
    } catch (error) {
      this.inviteFeedback.set({
        type: 'error',
        message: error instanceof Error ? error.message : 'Invite failed.',
      });
    } finally {
      this.inviteSubmitting.set(false);
    }
  }

  async removeMember(userId: string): Promise<void> {
    const editing = this.editingProject();
    if (!editing) {
      return;
    }
    this.inviteSubmitting.set(true);
    try {
      await this.projects.removeMember(editing.id, userId);
      const refreshed =
        this.projects.list().find((project) => project.id === editing.id) ??
        editing;
      this.editingProject.set(refreshed);
      this.inviteFeedback.set({
        type: 'success',
        message: 'Sharing access updated.',
      });
    } finally {
      this.inviteSubmitting.set(false);
    }
  }

  memberLabel(userId: string): string {
    const project = this.editingProject();
    const member = project?.members.find((item) => item.userId === userId);
    return member?.invitedEmail ?? userId.slice(0, 8);
  }

  memberStatusLabel(status: string): string {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'pending':
        return 'Pending';
      case 'declined':
        return 'Declined';
      default:
        return status;
    }
  }

  addQueuedInvite(input: string): void {
    if (input && !this.invites().includes(input)) {
      this.invites.set([...this.invites(), input]);
    }
    this.inviteInput.set('');
  }

  chooseColor(color: string): void {
    this.form.controls.color.setValue(color);
  }

  chooseIcon(icon: ProjectIconKey): void {
    this.form.controls.icon.setValue(icon);
  }

  private isProjectTab(tab: string): tab is ProjectTab {
    return this.tabs.some((candidate) => candidate.key === tab);
  }

  async submit(): Promise<void> {
    const user = this.user();
    if (this.form.invalid || !user) {
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
          ownerId: user.id,
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
        icon: resolveProjectIconKey(project.icon),
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
      projectType:
        preset.defaults?.projectType ?? this.defaultFormState.projectType,
      ancestorId:
        preset.defaults?.ancestorId ?? this.defaultFormState.ancestorId,
      color: preset.defaults?.color ?? this.defaultFormState.color,
      icon: resolveProjectIconKey(
        preset.defaults?.icon ?? this.defaultFormState.icon
      ),
    });
  }

  private resetForm(overrides?: Partial<typeof this.defaultFormState>): void {
    this.form.reset({
      ...this.defaultFormState,
      ...overrides,
    });
  }
}
