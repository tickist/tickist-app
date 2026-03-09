import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseAuthService } from './supabase-auth.service';
import { ThemeService } from '../../core/ui/theme.service';
import { AuthShellComponent } from './auth-shell.component';

vi.setConfig({ testTimeout: 60000 });

describe('AuthShellComponent passwordChanged notice', () => {
  let fixture: ComponentFixture<AuthShellComponent>;
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    navigateMock = vi.fn(async () => true);

    await TestBed.configureTestingModule({
      imports: [AuthShellComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'passwordChanged' ? '1' : null),
              },
            },
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: navigateMock,
          },
        },
        {
          provide: SupabaseAuthService,
          useValue: {
            signInWithPassword: vi.fn(async () => ({ error: null })),
          },
        },
        {
          provide: ThemeService,
          useValue: {
            isDark: signal(true).asReadonly(),
            toggleTheme: vi.fn(),
          },
        },
      ],
    })
      .overrideComponent(AuthShellComponent, {
        set: {
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AuthShellComponent);
    fixture.detectChanges();
  });

  it('shows a success message and clears the query param from the URL', () => {
    const component = fixture.componentInstance;

    expect(component.message()).toEqual({
      type: 'success',
      text: 'Password changed. Sign in with your new password.',
    });
    expect(navigateMock).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { passwordChanged: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });
});
