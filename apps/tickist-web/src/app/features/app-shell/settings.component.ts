import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { ToastService } from '../../core/ui/toast.service';
import { SupabaseAuthService } from '../auth/supabase-auth.service';
import { AvatarService } from '../../data/avatar.service';
import {
  ExportImportService,
  ImportResult,
  ImportValidationReport,
} from '../../data/export-import.service';
import { ProjectDataService } from '../../data/project-data.service';
import { TaskDataService } from '../../data/task-data.service';
import { TagDataService } from '../../data/tag-data.service';

type SettingsTab = 'account' | 'password' | 'notifications' | 'backup';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  private readonly session = inject(SupabaseSessionService);
  private readonly auth = inject(SupabaseAuthService);
  private readonly avatarService = inject(AvatarService);
  private readonly exportImportService = inject(ExportImportService);
  private readonly projects = inject(ProjectDataService);
  private readonly tasks = inject(TaskDataService);
  private readonly tags = inject(TagDataService);
  private readonly fb = inject(FormBuilder);
  private readonly toasts = inject(ToastService);

  readonly user = computed(() => this.session.user());
  readonly activeTab = signal<SettingsTab>('account');
  readonly updating = signal(false);
  readonly avatarUploading = signal(false);
  readonly avatarRemoving = signal(false);
  readonly exportOnlyActive = signal(false);
  readonly exportSelectedProjectsOnly = signal(false);
  readonly selectedProjectIds = signal<string[]>([]);
  readonly exportBusy = signal(false);
  readonly importBusy = signal(false);
  readonly importFile = signal<File | null>(null);
  readonly importValidation = signal<ImportValidationReport | ImportResult | null>(
    null
  );
  readonly accountForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: [{ value: '', disabled: true }],
  });
  readonly avatarPreviewUrl = computed(() => {
    const metadata = this.userMetadata();
    const avatarUrl = asOptionalString(metadata['avatar_url']);
    if (!avatarUrl) {
      return null;
    }
    const version = asOptionalString(metadata['avatar_version']);
    return appendCacheVersion(avatarUrl, version);
  });
  readonly avatarInitial = computed(() => {
    const displayName = this.accountForm.controls.displayName.value.trim();
    if (displayName.length > 0) {
      return displayName.charAt(0).toUpperCase();
    }
    const email = this.user()?.email ?? '';
    return email ? email.charAt(0).toUpperCase() : '?';
  });
  readonly availableProjects = computed(() => {
    const userId = this.user()?.id;
    if (!userId) {
      return [];
    }
    return this.projects
      .list()
      .filter((project) => project.ownerId === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  constructor() {
    effect(() => {
      const user = this.user();
      const metadata = this.userMetadata();
      this.accountForm.patchValue(
        {
          displayName: asOptionalString(metadata['full_name']) ?? user?.email ?? '',
          email: user?.email ?? '',
        },
        { emitEvent: false }
      );
    });

    effect(() => {
      const allowedIds = new Set(this.availableProjects().map((project) => project.id));
      this.selectedProjectIds.update((current) =>
        current.filter((projectId) => allowedIds.has(projectId))
      );
    });
  }

  select(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  async saveAccount(): Promise<void> {
    const user = this.user();
    if (!user) {
      this.toasts.error('You must be signed in.');
      return;
    }
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }
    this.updating.set(true);
    try {
      const fullName = this.accountForm.value.displayName?.trim() ?? '';
      await this.auth.updateProfileMetadata({ full_name: fullName });
      this.toasts.success('Display name updated.');
    } catch (error) {
      console.error('[Settings] failed to update account', error);
      this.toasts.error('Could not update account.');
    } finally {
      this.updating.set(false);
    }
  }

  async deleteAccount(): Promise<void> {
    this.toasts.error('Account removal is not enabled in this build.');
  }

  async exportBackup(): Promise<void> {
    if (!this.user()) {
      this.toasts.error('You must be signed in.');
      return;
    }

    const projectIds = this.exportSelectedProjectsOnly()
      ? this.selectedProjectIds()
      : [];

    if (this.exportSelectedProjectsOnly() && projectIds.length === 0) {
      this.toasts.error('Select at least one project for filtered export.');
      return;
    }

    this.exportBusy.set(true);
    try {
      const blob = await this.exportImportService.exportToBlob({
        onlyActive: this.exportOnlyActive(),
        projectIds,
      });
      this.downloadBlob(blob, buildBackupFilename());
      this.toasts.success('Backup exported.');
    } catch (error) {
      console.error('[Settings] failed to export backup', error);
      this.toasts.error('Could not export backup file.');
    } finally {
      this.exportBusy.set(false);
    }
  }

  onExportOnlyActiveChanged(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.exportOnlyActive.set(target?.checked ?? false);
  }

  onExportSelectedProjectsChanged(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const checked = target?.checked ?? false;
    this.exportSelectedProjectsOnly.set(checked);
    if (!checked) {
      this.selectedProjectIds.set([]);
    }
  }

  onProjectSelectionChanged(projectId: string, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const checked = target?.checked ?? false;

    this.selectedProjectIds.update((current) => {
      if (checked && !current.includes(projectId)) {
        return [...current, projectId];
      }
      if (!checked) {
        return current.filter((id) => id !== projectId);
      }
      return current;
    });
  }

  async onImportFileSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.item(0) ?? null;

    this.importFile.set(file);
    this.importValidation.set(null);

    if (!file) {
      return;
    }

    try {
      const validation = await this.exportImportService.validateImportFile(file);
      this.importValidation.set(validation);
      if (validation.ok) {
        this.toasts.success('Import file validated.');
      } else {
        this.toasts.error('Import file is not valid.');
      }
    } catch (error) {
      console.error('[Settings] failed to validate import file', error);
      this.toasts.error('Could not read import file.');
    }
  }

  async runImport(dryRun: boolean): Promise<void> {
    const file = this.importFile();
    if (!file) {
      this.toasts.error('Choose a JSON file first.');
      return;
    }

    this.importBusy.set(true);
    try {
      const result = await this.exportImportService.importFromFile(file, {
        dryRun,
        skipOlder: true,
      });
      this.importValidation.set(result);

      if (!result.ok) {
        this.toasts.error('Import failed. Review reported errors.');
        return;
      }

      if (dryRun) {
        this.toasts.success(`Dry run complete: ${formatImportCounts(result)}.`);
        return;
      }

      await Promise.all([
        this.projects.refresh(),
        this.tags.refresh(),
        this.tasks.refresh(),
      ]);
      this.toasts.success(`Import complete: ${formatImportCounts(result)}.`);
    } catch (error) {
      console.error('[Settings] failed to import backup', error);
      this.toasts.error('Could not import backup file.');
    } finally {
      this.importBusy.set(false);
    }
  }

  async onAvatarSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.item(0) ?? null;
    if (target) {
      target.value = '';
    }
    const validation = this.avatarService.validateAvatarFile(file);
    if (!validation.ok) {
      this.toasts.error(validation.reason ?? 'Invalid avatar file.');
      return;
    }

    const user = this.user();
    if (!user || !file) {
      this.toasts.error('You must be signed in.');
      return;
    }

    this.avatarUploading.set(true);
    try {
      const upload = await this.avatarService.uploadAvatar(file);
      await this.auth.updateProfileMetadata({
        avatar_url: upload.publicUrl,
        avatar_path: upload.objectPath,
        avatar_version: Date.now().toString(),
      });
      this.toasts.success('Avatar updated.');
    } catch (error) {
      console.error('[Settings] failed to update avatar', error);
      this.toasts.error('Could not upload avatar.');
    } finally {
      this.avatarUploading.set(false);
    }
  }

  async removeAvatar(): Promise<void> {
    if (!this.user()) {
      this.toasts.error('You must be signed in.');
      return;
    }

    this.avatarRemoving.set(true);
    try {
      const metadata = this.userMetadata();
      const avatarPath = asOptionalString(metadata['avatar_path']) ?? null;
      await this.avatarService.removeAvatar(avatarPath);
      await this.auth.updateProfileMetadata({
        avatar_url: null,
        avatar_path: null,
        avatar_version: Date.now().toString(),
      });
      this.toasts.success('Avatar removed.');
    } catch (error) {
      console.error('[Settings] failed to remove avatar', error);
      this.toasts.error('Could not remove avatar.');
    } finally {
      this.avatarRemoving.set(false);
    }
  }

  private userMetadata(): Record<string, unknown> {
    const metadata = this.user()?.user_metadata;
    return isRecord(metadata) ? metadata : {};
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

function buildBackupFilename(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `tickist-backup-${timestamp}.json`;
}

function formatImportCounts(result: ImportResult): string {
  return [
    `${result.counts.projects.created + result.counts.projects.updated} projects`,
    `${result.counts.tags.created + result.counts.tags.updated} tags`,
    `${result.counts.tasks.created + result.counts.tasks.updated} tasks`,
  ].join(', ');
}

function appendCacheVersion(url: string, version: string | null): string {
  if (!version) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
