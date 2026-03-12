import assert from 'node:assert/strict';
import { DatePipe, NgFor, NgIf, NgOptimizedImage } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink, RouterOutlet } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseAuthService } from '../auth/supabase-auth.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { NotificationDataService } from '../../data/notification-data.service';
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
  beforeEach(async () => {
    localStorage.clear();

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
            list: signal([]).asReadonly(),
            loadingState: signal(false).asReadonly(),
            refresh: vi.fn(async () => undefined),
            markAsRead: vi.fn(async () => undefined),
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
            NgIf,
            NgFor,
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
