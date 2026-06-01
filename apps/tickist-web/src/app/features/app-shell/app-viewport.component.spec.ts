import assert from 'node:assert/strict';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink, RouterOutlet } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseAuthService } from '../auth/supabase-auth.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import {
  NotificationDataService,
  type NotificationItem,
} from '../../data/notification-data.service';
import { AppViewStateService } from './app-view-state.service';
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

  beforeEach(async () => {
    localStorage.clear();
    notifications = signal<NotificationItem[]>([]);
    markAllAsRead = vi.fn(async () => undefined);

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
          provide: AppViewStateService,
          useValue: {
            searchTerm: signal('').asReadonly(),
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
            MockToastContainerComponent,
          ],
        },
      })
      .compileComponents();
  });

  it('renders toggle and switches data-theme on click', () => {
    const fixture = TestBed.createComponent(AppViewportComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="theme-toggle"]'
    ) as HTMLButtonElement | null;

    expect(button).not.toBeNull();
    expect(button?.getAttribute('aria-label')).toBeTruthy();

    const initialTheme = document.documentElement.getAttribute('data-theme');
    button?.click();
    fixture.detectChanges();

    const nextTheme = document.documentElement.getAttribute('data-theme');
    expect(nextTheme).toBeTruthy();
    expect(nextTheme).not.toBe(initialTheme);
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
      fixture.nativeElement.querySelectorAll('button')
    ).find((candidate): candidate is HTMLButtonElement =>
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

    const button = fixture.nativeElement.querySelector(
      'button[aria-label="Close notifications"]'
    ) as HTMLButtonElement | null;

    expect(button).toBeTruthy();
    expect(button?.textContent?.trim()).toBe('×');
    expect(button?.textContent).not.toContain('Close');
  });

  it('uses an icon-only close button in the mobile sidebar', () => {
    const fixture = TestBed.createComponent(AppViewportComponent);
    fixture.detectChanges();
    fixture.componentInstance.sidebarOpen.set(true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      'button[aria-label="Close sidebar"]'
    ) as HTMLButtonElement | null;

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
