import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AvatarService } from '../../data/avatar.service';
import { ExportImportService } from '../../data/export-import.service';
import { NotificationPreferencesService } from '../../data/notification-preferences.service';
import { ProjectDataService } from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { TaskDataService } from '../../data/task-data.service';
import { ToastService } from '../../core/ui/toast.service';
import { SupabaseAuthService } from '../auth/supabase-auth.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { AppViewStateService } from './app-view-state.service';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent password form', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let changePasswordMock: ReturnType<typeof vi.fn>;
  let signOutMock: ReturnType<typeof vi.fn>;
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    changePasswordMock = vi.fn(async () => undefined);
    signOutMock = vi.fn(async () => undefined);
    navigateMock = vi.fn(async () => true);

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: navigateMock,
            navigateByUrl: vi.fn(async () => true),
          },
        },
        {
          provide: AppViewStateService,
          useValue: {
            lastNonSheetAppUrl: signal<string | null>(
              '/app/tasks'
            ).asReadonly(),
            lastNonSettingsAppUrl: signal<string | null>(
              '/app/tasks'
            ).asReadonly(),
          },
        },
        {
          provide: SupabaseSessionService,
          useValue: {
            user: () => ({
              id: 'owner-1',
              email: 'owner@example.com',
              user_metadata: { full_name: 'Owner One' },
            }),
          },
        },
        {
          provide: SupabaseAuthService,
          useValue: {
            updateProfileMetadata: vi.fn(async () => undefined),
            changePasswordWithCurrentPassword: changePasswordMock,
            signOut: signOutMock,
          },
        },
        {
          provide: AvatarService,
          useValue: {
            validateAvatarFile: vi.fn(() => ({ ok: true })),
            uploadAvatar: vi.fn(async () => ({
              objectPath: 'avatars/owner-1.png',
              publicUrl: 'avatar.png',
            })),
            removeAvatar: vi.fn(async () => undefined),
          },
        },
        {
          provide: ExportImportService,
          useValue: {
            exportToBlob: vi.fn(async () => new Blob()),
            validateImportFile: vi.fn(async () => ({
              ok: true,
              summary: {
                projects: 0,
                tags: 0,
                tasks: 0,
                taskSteps: 0,
                taskTags: 0,
              },
              errors: [],
              warnings: [],
            })),
            importFromFile: vi.fn(async () => ({
              ok: true,
              summary: {
                projects: 0,
                tags: 0,
                tasks: 0,
                taskSteps: 0,
                taskTags: 0,
              },
              errors: [],
              warnings: [],
              counts: {
                projects: { created: 0, updated: 0 },
                tags: { created: 0, updated: 0 },
                tasks: { created: 0, updated: 0 },
                taskSteps: { replacedTasks: 0, rowsWritten: 0 },
                taskTags: { replacedTasks: 0, rowsWritten: 0 },
              },
            })),
          },
        },
        {
          provide: ProjectDataService,
          useValue: {
            list: () => [],
            refresh: vi.fn(async () => undefined),
          },
        },
        {
          provide: TaskDataService,
          useValue: {
            refresh: vi.fn(async () => undefined),
          },
        },
        {
          provide: TagDataService,
          useValue: {
            refresh: vi.fn(async () => undefined),
          },
        },
        {
          provide: ToastService,
          useValue: {
            success: vi.fn(),
            error: vi.fn(),
          },
        },
        buildNotificationPreferencesProvider(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    fixture.componentInstance.select('password');
    fixture.detectChanges();
  });

  it('keeps submit disabled for invalid, mismatched, and reused passwords', async () => {
    expect(getSubmitButton().disabled).toBe(true);

    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'short',
      newPassword: 'short',
      confirmPassword: 'short',
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(getSubmitButton().disabled).toBe(true);

    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'Current123!',
      newPassword: 'Updated123!',
      confirmPassword: 'Mismatch123!',
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(getSubmitButton().disabled).toBe(true);

    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'Current123!',
      newPassword: 'Current123!',
      confirmPassword: 'Current123!',
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(getSubmitButton().disabled).toBe(true);
  });

  it('shows an inline error when the current password is wrong', async () => {
    changePasswordMock.mockRejectedValue(
      new Error('Current password is incorrect.')
    );

    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'Wrong123!',
      newPassword: 'Updated123!',
      confirmPassword: 'Updated123!',
    });

    await fixture.componentInstance.changePassword();
    fixture.detectChanges();

    expect(fixture.componentInstance.passwordError()).toBe(
      'Current password is incorrect.'
    );
    expect(getInlineError()?.textContent).toContain(
      'Current password is incorrect.'
    );
    expect(signOutMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('updates the password, signs out, and redirects to auth on success', async () => {
    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'Current123!',
      newPassword: 'Updated123!',
      confirmPassword: 'Updated123!',
    });

    await fixture.componentInstance.changePassword();

    expect(changePasswordMock).toHaveBeenCalledWith({
      currentPassword: 'Current123!',
      newPassword: 'Updated123!',
    });
    expect(signOutMock).toHaveBeenCalledOnce();
    expect(navigateMock).toHaveBeenCalledWith(['/auth'], {
      queryParams: { passwordChanged: 1 },
    });
  });

  function getSubmitButton(): HTMLButtonElement {
    const button = fixture.nativeElement.querySelector(
      '[data-testid="settings-password-submit"]'
    ) as HTMLButtonElement | null;
    if (!button) {
      throw new Error('Missing settings password submit button');
    }
    return button;
  }

  function getInlineError(): HTMLParagraphElement | null {
    return fixture.nativeElement.querySelector(
      '[data-testid="settings-password-error"]'
    ) as HTMLParagraphElement | null;
  }
});

function buildNotificationPreferencesProvider() {
  return {
    provide: NotificationPreferencesService,
    useValue: {
      preferences: signal([
        {
          key: 'weekly_summary',
          channel: 'email',
          enabled: true,
          scheduleType: 'weekly',
          dayOfWeek: 0,
          timeOfDay: '20:00',
          timezone: 'UTC',
        },
        {
          key: 'daily_summary',
          channel: 'email',
          enabled: false,
          scheduleType: 'daily',
          dayOfWeek: null,
          timeOfDay: '20:00',
          timezone: 'UTC',
        },
      ]).asReadonly(),
      loadingState: signal(false).asReadonly(),
      refresh: vi.fn(async () => undefined),
      save: vi.fn(async () => undefined),
    },
  };
}
