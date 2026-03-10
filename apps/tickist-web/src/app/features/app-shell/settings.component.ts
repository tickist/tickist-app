import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { startWith } from 'rxjs';
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
import { AppViewStateService } from './app-view-state.service';
import { NotificationPreferencesService } from '../../data/notification-preferences.service';
import { ApiTokenService } from '../../data/api-token.service';
import {
  SheetScaffoldComponent,
  SheetScaffoldTab,
} from '../../core/ui/sheet-scaffold.component';

type SettingsTab = 'account' | 'password' | 'notifications' | 'backup' | 'api-tokens';
type WeekdayOption = { value: number; label: string };

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DEFAULT_NOTIFICATION_TIME = '20:00';
const WEEKDAY_OPTIONS: WeekdayOption[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, SheetScaffoldComponent, DatePipe],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly session = inject(SupabaseSessionService);
  private readonly auth = inject(SupabaseAuthService);
  private readonly avatarService = inject(AvatarService);
  private readonly exportImportService = inject(ExportImportService);
  private readonly projects = inject(ProjectDataService);
  private readonly tasks = inject(TaskDataService);
  private readonly tags = inject(TagDataService);
  private readonly notificationPreferences = inject(
    NotificationPreferencesService
  );
  private readonly apiTokenService = inject(ApiTokenService);
  private readonly fb = inject(FormBuilder);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly viewState = inject(AppViewStateService);

  readonly user = computed(() => this.session.user());
  readonly activeTab = signal<SettingsTab>('account');
  readonly tabs: readonly SheetScaffoldTab<SettingsTab>[] = [
    { key: 'account', label: 'Account', icon: '👤' },
    { key: 'password', label: 'Password', icon: '🔒' },
    { key: 'notifications', label: 'Notifications', icon: '🔔' },
    { key: 'backup', label: 'Backup & Restore', icon: '🗂️' },
    { key: 'api-tokens', label: 'API Tokens', icon: '🔑' },
  ];
  readonly updating = signal(false);
  readonly passwordUpdating = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly avatarUploading = signal(false);
  readonly avatarRemoving = signal(false);
  readonly notificationsSaving = signal(false);
  readonly exportOnlyActive = signal(false);
  readonly exportSelectedProjectsOnly = signal(false);
  readonly selectedProjectIds = signal<string[]>([]);
  readonly exportBusy = signal(false);
  readonly importBusy = signal(false);
  readonly importFile = signal<File | null>(null);
  readonly importValidation = signal<
    ImportValidationReport | ImportResult | null
  >(null);

  // API Tokens tab
  readonly apiTokens = this.apiTokenService.list;
  readonly apiTokensLoading = this.apiTokenService.isLoading;
  readonly tokenCreating = signal(false);
  readonly tokenDeleting = signal<string | null>(null);
  readonly newTokenName = signal('MCP Token');
  readonly revealedToken = signal<string | null>(null);
  readonly tokenCopied = signal(false);
  readonly accountForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: [{ value: '', disabled: true }],
  });
  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });
  readonly notificationsForm = this.fb.nonNullable.group({
    weeklyEmailEnabled: false,
    weeklyEmailDayOfWeek: 0,
    weeklyEmailTime: [
      DEFAULT_NOTIFICATION_TIME,
      [Validators.required, Validators.pattern(TIME_PATTERN)],
    ],
    dailyEmailEnabled: false,
    dailyEmailTime: [
      DEFAULT_NOTIFICATION_TIME,
      [Validators.required, Validators.pattern(TIME_PATTERN)],
    ],
    timezone: [resolveBrowserTimezone(), [Validators.required]],
  });
  private readonly passwordFormValue = toSignal(
    this.passwordForm.valueChanges.pipe(
      startWith(this.passwordForm.getRawValue())
    ),
    { initialValue: this.passwordForm.getRawValue() }
  );
  private readonly passwordFormStatus = toSignal(
    this.passwordForm.statusChanges.pipe(startWith(this.passwordForm.status)),
    { initialValue: this.passwordForm.status }
  );
  private readonly notificationsFormStatus = toSignal(
    this.notificationsForm.statusChanges.pipe(
      startWith(this.notificationsForm.status)
    ),
    { initialValue: this.notificationsForm.status }
  );
  private readonly notificationTimezoneValue = toSignal(
    this.notificationsForm.controls.timezone.valueChanges.pipe(
      startWith(this.notificationsForm.controls.timezone.value)
    ),
    { initialValue: this.notificationsForm.controls.timezone.value }
  );
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
  readonly closeTarget = computed(
    () => this.viewState.lastNonSheetAppUrl() ?? '/app'
  );
  readonly footerPrimaryLabel = computed(() => {
    switch (this.activeTab()) {
      case 'account':
        return 'Save changes';
      case 'password':
        return this.passwordUpdating() ? 'Updating...' : 'Update password';
      case 'notifications':
        return this.notificationsSaving()
          ? 'Saving...'
          : 'Save notification settings';
      default:
        return null;
    }
  });
  readonly footerPrimaryDisabled = computed(() => {
    switch (this.activeTab()) {
      case 'account':
        return this.updating();
      case 'password':
        return this.passwordSubmitDisabled();
      case 'notifications':
        return this.notificationsSubmitDisabled();
      default:
        return true;
    }
  });
  readonly notificationPreferencesList =
    this.notificationPreferences.preferences;
  readonly notificationsLoading = this.notificationPreferences.loadingState;
  readonly weekdayOptions = WEEKDAY_OPTIONS;
  readonly notificationTimezone = computed(
    () => this.notificationTimezoneValue() ?? 'UTC'
  );
  readonly passwordsMismatch = computed(() => {
    const { newPassword, confirmPassword } = this.passwordFormValue();
    return Boolean(
      newPassword && confirmPassword && newPassword !== confirmPassword
    );
  });
  readonly passwordMatchesCurrent = computed(() => {
    const { currentPassword, newPassword } = this.passwordFormValue();
    return Boolean(
      currentPassword && newPassword && currentPassword === newPassword
    );
  });
  readonly passwordSubmitDisabled = computed(() => {
    this.passwordFormStatus();
    return (
      this.passwordForm.invalid ||
      this.passwordUpdating() ||
      this.passwordsMismatch() ||
      this.passwordMatchesCurrent()
    );
  });
  readonly notificationsSubmitDisabled = computed(() => {
    this.notificationsFormStatus();
    return (
      this.notificationsForm.invalid ||
      this.notificationsSaving() ||
      this.notificationsLoading()
    );
  });

  constructor() {
    effect(() => {
      const user = this.user();
      const metadata = this.userMetadata();
      this.accountForm.patchValue(
        {
          displayName:
            asOptionalString(metadata['full_name']) ?? user?.email ?? '',
          email: user?.email ?? '',
        },
        { emitEvent: false }
      );
    });

    effect(() => {
      const allowedIds = new Set(
        this.availableProjects().map((project) => project.id)
      );
      this.selectedProjectIds.update((current) =>
        current.filter((projectId) => allowedIds.has(projectId))
      );
    });

    effect(() => {
      const userId = this.user()?.id ?? null;
      void this.notificationPreferences.refresh(userId);
    });

    effect(() => {
      if (this.user()) {
        void this.apiTokenService.refresh();
      }
    });

    effect(() => {
      const weekly = findNotificationPreference(
        this.notificationPreferencesList(),
        'weekly_summary'
      );
      const daily = findNotificationPreference(
        this.notificationPreferencesList(),
        'daily_summary'
      );
      this.notificationsForm.patchValue(
        {
          weeklyEmailEnabled: weekly.enabled,
          weeklyEmailDayOfWeek: weekly.dayOfWeek ?? 0,
          weeklyEmailTime: weekly.timeOfDay,
          dailyEmailEnabled: daily.enabled,
          dailyEmailTime: daily.timeOfDay,
          timezone:
            weekly.timezone || daily.timezone || resolveBrowserTimezone(),
        },
        { emitEvent: false }
      );
    });
  }

  select(tab: string): void {
    this.activeTab.set(tab as SettingsTab);
  }

  async closePanel(): Promise<void> {
    await this.router.navigateByUrl(this.closeTarget());
  }

  async submitActiveTab(): Promise<void> {
    switch (this.activeTab()) {
      case 'account':
        await this.saveAccount();
        return;
      case 'password':
        await this.changePassword();
        return;
      case 'notifications':
        await this.saveNotifications();
        return;
      default:
        return;
    }
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

  async changePassword(): Promise<void> {
    this.passwordError.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    if (this.passwordMatchesCurrent()) {
      this.passwordError.set(
        'New password must be different from the current password.'
      );
      return;
    }

    if (this.passwordsMismatch()) {
      this.passwordError.set('Passwords must match.');
      return;
    }

    this.passwordUpdating.set(true);
    try {
      const { currentPassword, newPassword } = this.passwordForm.getRawValue();
      await this.auth.changePasswordWithCurrentPassword({
        currentPassword,
        newPassword,
      });
      this.passwordForm.reset();
      await this.auth.signOut();
      await this.router.navigate(['/auth'], {
        queryParams: { passwordChanged: 1 },
      });
    } catch (error) {
      console.error('[Settings] failed to change password', error);
      this.passwordError.set(
        error instanceof Error ? error.message : 'Could not change password.'
      );
    } finally {
      this.passwordUpdating.set(false);
    }
  }

  async saveNotifications(): Promise<void> {
    const user = this.user();
    if (!user) {
      this.toasts.error('You must be signed in.');
      return;
    }

    if (this.notificationsForm.invalid) {
      this.notificationsForm.markAllAsTouched();
      return;
    }

    const timezone = resolveBrowserTimezone();
    this.notificationsForm.controls.timezone.setValue(timezone, {
      emitEvent: false,
    });

    const raw = this.notificationsForm.getRawValue();
    this.notificationsSaving.set(true);
    try {
      await this.notificationPreferences.save(user.id, [
        {
          key: 'weekly_summary',
          channel: 'email',
          enabled: raw.weeklyEmailEnabled,
          scheduleType: 'weekly',
          dayOfWeek: raw.weeklyEmailDayOfWeek,
          timeOfDay: raw.weeklyEmailTime,
          timezone,
        },
        {
          key: 'daily_summary',
          channel: 'email',
          enabled: raw.dailyEmailEnabled,
          scheduleType: 'daily',
          dayOfWeek: null,
          timeOfDay: raw.dailyEmailTime,
          timezone,
        },
      ]);
      this.toasts.success('Notification preferences updated.');
    } catch (error) {
      console.error(
        '[Settings] failed to update notification preferences',
        error
      );
      this.toasts.error('Could not update notification preferences.');
    } finally {
      this.notificationsSaving.set(false);
    }
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
      const validation = await this.exportImportService.validateImportFile(
        file
      );
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

  async createApiToken(): Promise<void> {
    const user = this.user();
    if (!user) {
      this.toasts.error('You must be signed in.');
      return;
    }

    const name = this.newTokenName().trim();
    if (!name) {
      this.toasts.error('Token name is required.');
      return;
    }

    this.tokenCreating.set(true);
    this.revealedToken.set(null);
    this.tokenCopied.set(false);

    try {
      const result = await this.apiTokenService.createToken(user.id, name);
      if (result) {
        this.revealedToken.set(result.rawToken);
        this.newTokenName.set('MCP Token');
        this.toasts.success('API token created. Copy it now — it won\'t be shown again.');
      } else {
        this.toasts.error('Could not create API token.');
      }
    } catch (error) {
      console.error('[Settings] failed to create API token', error);
      this.toasts.error('Could not create API token.');
    } finally {
      this.tokenCreating.set(false);
    }
  }

  async deleteApiToken(tokenId: string): Promise<void> {
    this.tokenDeleting.set(tokenId);
    try {
      const deleted = await this.apiTokenService.deleteToken(tokenId);
      if (deleted) {
        this.toasts.success('Token revoked.');
      } else {
        this.toasts.error('Could not delete token.');
      }
    } catch (error) {
      console.error('[Settings] failed to delete API token', error);
      this.toasts.error('Could not delete token.');
    } finally {
      this.tokenDeleting.set(null);
    }
  }

  async copyToken(): Promise<void> {
    const token = this.revealedToken();
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      this.tokenCopied.set(true);
      this.toasts.success('Token copied to clipboard.');
      setTimeout(() => this.tokenCopied.set(false), 3000);
    } catch {
      this.toasts.error('Could not copy to clipboard.');
    }
  }

  onTokenNameChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.newTokenName.set(target?.value ?? '');
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
    `${result.counts.projects.created + result.counts.projects.updated
    } projects`,
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
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function findNotificationPreference(
  items: ReturnType<NotificationPreferencesService['preferences']>,
  key: 'weekly_summary' | 'daily_summary'
) {
  const match = items.find((item) => item.key === key);
  if (match) {
    return match;
  }

  if (key === 'weekly_summary') {
    return {
      key,
      channel: 'email' as const,
      enabled: false,
      scheduleType: 'weekly' as const,
      dayOfWeek: 0,
      timeOfDay: DEFAULT_NOTIFICATION_TIME,
      timezone: resolveBrowserTimezone(),
    };
  }

  return {
    key,
    channel: 'email' as const,
    enabled: false,
    scheduleType: 'daily' as const,
    dayOfWeek: null,
    timeOfDay: DEFAULT_NOTIFICATION_TIME,
    timezone: resolveBrowserTimezone(),
  };
}

function resolveBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
