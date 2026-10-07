import {
  fixtureHost,
  requiredElement,
  elementsOfType,
} from '../../../testing/dom';
import assert from 'node:assert/strict';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink, RouterOutlet } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseAuthService } from '../auth/supabase-auth.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { EmailMonitoringService } from '../../data/email-monitoring.service';
import {
  NotificationDataService,
  type NotificationItem,
} from '../../data/notification-data.service';
import { AppViewStateService } from './app-view-state.service';
import { ProjectIconComponent } from '../../core/ui/project-icon.component';
import {
  WorkspaceDataService,
  type Workspace,
} from '../../data/workspace-data.service';
import {
  AppViewportComponent,
  isRememberedAppUrl,
  isSheetRoute,
} from './app-viewport.component';

@Component({ selector: 'app-sidebar', standalone: true, template: '' })
class MockSidebarComponent {}

@Component({ selector: 'app-task-fab', standalone: true, template: '' })
class MockTaskFabComponent {}

@Component({ selector: 'app-toast-container', standalone: true, template: '' })
class MockToastContainerComponent {}

describe('AppViewportComponent theme toggle', () => {
  let notifications: ReturnType<typeof signal<NotificationItem[]>>;
  let markAllAsRead: ReturnType<typeof vi.fn>;
  const adminAllowed = signal(false);
  const checkAdminAccess = vi.fn(async () => adminAllowed());
  const workspaceItems = signal<Workspace[]>([]);

  const selectedWorkspaceId = signal<string | null>(null);

  const selectWorkspace = vi.fn((id: string | null) =>
    selectedWorkspaceId.set(id)
  );

  beforeEach(async () => {
    localStorage.clear();
    notifications = signal<NotificationItem[]>([]);
    markAllAsRead = vi.fn(async () => undefined);
    adminAllowed.set(false);
    checkAdminAccess.mockClear();
    selectedWorkspaceId.set(null);
    selectWorkspace.mockClear();
    workspaceItems.set([{ id: 'work-id', name: 'Work', kind: 'work' }]);

    await TestBed.configureTestingModule({
      imports: [AppViewportComponent],
      providers: [
        provideRouter([]),
        {
          provide: SupabaseSessionService,
          useValue: {
            user: signal(null).asReadonly(),
          },
        },
        {
          provide: SupabaseAuthService,
          useValue: {
            signOut: vi.fn(async () => undefined),
          },
        },
        {
          provide: NotificationDataService,
          useValue: {
            list: notifications.asReadonly(),
            loadingState: signal(false).asReadonly(),
            refresh: vi.fn(async () => undefined),
            markAsRead: vi.fn(async () => undefined),
            markAllAsRead,
          },
        },
        {
          provide: EmailMonitoringService,
          useValue: {
            allowed: adminAllowed.asReadonly(),
            checkAccess: checkAdminAccess,
          },
        },
        {
          provide: WorkspaceDataService,
          useValue: {
            list: workspaceItems.asReadonly(),
            selectedWorkspaceId: selectedWorkspaceId.asReadonly(),
            select: selectWorkspace,
          },
        },
        {
          provide: AppViewStateService,
          useValue: {
            searchTerm: signal('').asReadonly(),
            selectedProjectId: signal(null).asReadonly(),
            selectProject: vi.fn(),
            updateSearchTerm: vi.fn(),
            clearSearch: vi.fn(),
            rememberLastNonSheetAppUrl: vi.fn(),
            rememberLastNonSettingsAppUrl: vi.fn(),
          },
        },
      ],
    })
      .overrideComponent(AppViewportComponent, {
        set: {
          imports: [
            RouterOutlet,
            RouterLink,
            NgOptimizedImage,
            DatePipe,
            MockSidebarComponent,
            MockTaskFabComponent,
            ProjectIconComponent,
            MockToastContainerComponent,
          ],
        },
      })
      .compileComponents();
  });

  it('renders toggle and switches data-theme on click', () => {
    const fixture = TestBed.createComponent(AppViewportComponent);
    fixture.detectChanges();

    const button = requiredElement(
      fixtureHost(fixture),
      '[data-testid="theme-toggle"]',
      HTMLButtonElement
    );

    expect(button).not.toBeNull();
    expect(button?.getAttribute('aria-label')).toBeTruthy();

    const initialTheme = document.documentElement.getAttribute('data-theme');
    button?.click();
    fixture.detectChanges();

    const nextTheme = document.documentElement.getAttribute('data-theme');
    expect(nextTheme).toBeTruthy();
    expect(nextTheme).not.toBe(initialTheme);
  });

  it('renders the workspace switcher and selects a workspace', () => {
    const fixture = TestBed.createComponent(AppViewportComponent);
    fixture.detectChanges();

    const trigger = requiredElement(
      fixtureHost(fixture),
      '[aria-label="Select workspace"]',
      HTMLButtonElement
    );

    expect(trigger.textContent).toContain('All');
    trigger.click();
    fixture.detectChanges();

    const options = elementsOfType(
      fixtureHost(fixture),
      '#workspace-menu button',
      HTMLButtonElement
    );

    const option = Array.from(options).find(
      (button) => button.textContent?.trim() === 'Work'
    );

    expect(option).toBeTruthy();
    option?.click();
    fixture.detectChanges();
    expect(selectWorkspace).toHaveBeenCalledWith('work-id');
    expect(trigger.textContent).toContain('Work');
  });

  it('places the workspace control immediately before the profile button', () => {
    const fixture = TestBed.createComponent(AppViewportComponent);
    fixture.detectChanges();

    const switcher = requiredElement(
      fixtureHost(fixture),
      '.workspace-switcher',
      HTMLDivElement
    );

    expect(switcher.nextElementSibling?.getAttribute('aria-label')).toBe(
      'Open profile menu'
    );
    expect(switcher.querySelector('app-project-icon')).not.toBeNull();
  });

  it('shows the admin panel in the profile menu only after administrator verification', () => {
    const fixture = TestBed.createComponent(AppViewportComponent);
    fixture.detectChanges();
    const profileButton = requiredElement(
      fixtureHost(fixture),
      '[aria-label="Open profile menu"]',
      HTMLButtonElement
    );

    profileButton.click();
    fixture.detectChanges();
    expect(checkAdminAccess).toHaveBeenCalledOnce();
    expect(
      fixtureHost(fixture).querySelector('[routerLink="/app/admin/email"]')
    ).toBeNull();

    adminAllowed.set(true);
    fixture.detectChanges();
    expect(
      fixtureHost(fixture).querySelector('[routerLink="/app/admin/email"]')
    ).not.toBeNull();
  });

  it('keeps long workspace names available in the trigger tooltip', () => {
    const name = 'A workspace with a much longer name';
    workspaceItems.set([{ id: 'work-id', name, kind: 'work' }]);
    selectedWorkspaceId.set('work-id');
    const fixture = TestBed.createComponent(AppViewportComponent);
    fixture.detectChanges();

    const trigger = requiredElement(
      fixtureHost(fixture),
      '[aria-label="Select workspace"]',
      HTMLButtonElement
    );

    expect(trigger.title).toBe('Workspace: ' + name);
    expect(
      trigger.querySelector('.workspace-switcher__label')?.textContent
    ).toBe(name);
  });

  it('returns keyboard focus to the trigger when Escape closes the workspace list', () => {
    const fixture = TestBed.createComponent(AppViewportComponent);
    document.body.append(fixtureHost(fixture));
    fixture.detectChanges();

    const trigger = requiredElement(
      fixtureHost(fixture),
      '[aria-label="Select workspace"]',
      HTMLButtonElement
    );

    trigger.click();
    fixture.detectChanges();

    const option = requiredElement(
      fixtureHost(fixture),
      '#workspace-menu button',
      HTMLButtonElement
    );

    option.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixtureHost(fixture).querySelector('#workspace-menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fixtureHost(fixture).remove();
  });

  it('marks all unread notifications as read from the notifications menu', async () => {
    notifications.set([
      {
        id: 'notification-1',
        recipientId: 'user-1',
        title: 'First notification',
        type: 'system',
        createdAt: '2026-05-11T08:00:00.000Z',
        isRead: false,
      },
      {
        id: 'notification-2',
        recipientId: 'user-1',
        title: 'Second notification',
        type: 'system',
        createdAt: '2026-05-11T09:00:00.000Z',
        isRead: true,
      },
    ]);

    const fixture = TestBed.createComponent(AppViewportComponent);
    fixture.detectChanges();
    fixture.componentInstance.notificationsOpen.set(true);
    fixture.detectChanges();

    const button = Array.from(
      fixtureHost(fixture).querySelectorAll('button')
    ).find(
      (candidate): candidate is HTMLButtonElement =>
        candidate.textContent?.includes('Read all') ?? false
    );

    expect(button).toBeTruthy();
    expect(button?.disabled).toBe(false);

    button?.click();
    await fixture.whenStable();

    expect(markAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('uses a compact icon-only close button in the notifications menu', () => {
    const fixture = TestBed.createComponent(AppViewportComponent);
    fixture.detectChanges();
    fixture.componentInstance.notificationsOpen.set(true);
    fixture.detectChanges();

    const button = requiredElement(
      fixtureHost(fixture),
      'button[aria-label="Close notifications"]',
      HTMLButtonElement
    );

    expect(button).toBeTruthy();
    expect(button?.textContent?.trim()).toBe('×');
    expect(button?.textContent).not.toContain('Close');
  });

  it('uses an icon-only close button in the mobile sidebar', () => {
    const fixture = TestBed.createComponent(AppViewportComponent);
    fixture.detectChanges();
    fixture.componentInstance.sidebarOpen.set(true);
    fixture.detectChanges();

    const button = requiredElement(
      fixtureHost(fixture),
      'button[aria-label="Close sidebar"]',
      HTMLButtonElement
    );

    expect(button).toBeTruthy();
    expect(button?.textContent?.trim()).toBe('✕');
    expect(button?.textContent).not.toContain('Close');
  });
});

describe('app viewport route helpers', () => {
  it('treats sheet routes with query params as sheets', () => {
    assert.equal(isSheetRoute('/app/project/new?projectType=active'), true);
    assert.equal(isSheetRoute('/app/task/new?projectId=project-1'), true);
    assert.equal(isSheetRoute('/app/project/project-1/edit?from=menu'), true);
  });

  it('does not remember sheet routes with query params as app return urls', () => {
    assert.equal(
      isRememberedAppUrl('/app/project/new?projectType=active'),
      false
    );
    assert.equal(
      isRememberedAppUrl('/app/task/new?projectId=project-1'),
      false
    );
    assert.equal(isRememberedAppUrl('/app/tasks/project-1?filter=done'), true);
  });
});
