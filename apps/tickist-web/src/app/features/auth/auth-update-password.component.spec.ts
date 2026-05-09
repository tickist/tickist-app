import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { ThemeService } from '../../core/ui/theme.service';
import { AuthUpdatePasswordComponent } from './auth-update-password.component';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseSessionService } from './supabase-session.service';

describe('AuthUpdatePasswordComponent', () => {
  let fixture: ComponentFixture<AuthUpdatePasswordComponent>;
  let updatePasswordMock: ReturnType<typeof vi.fn>;
  let signOutMock: ReturnType<typeof vi.fn>;
  let clearPasswordRecoveryPendingMock: ReturnType<typeof vi.fn>;
  let passwordRecoveryPending: ReturnType<typeof signal<boolean>>;
  let currentUser: ReturnType<typeof signal<User | null>>;
  let ready: ReturnType<typeof signal<boolean>>;
  let router: Router;

  beforeEach(async () => {
    updatePasswordMock = vi.fn(async () => undefined);
    signOutMock = vi.fn(async () => undefined);
    clearPasswordRecoveryPendingMock = vi.fn();
    passwordRecoveryPending = signal(false);
    currentUser = signal<User | null>(createUser());
    ready = signal(true);

    await TestBed.configureTestingModule({
      imports: [AuthUpdatePasswordComponent],
      providers: [
        provideRouter([]),
        {
          provide: SupabaseAuthService,
          useValue: {
            updatePassword: updatePasswordMock,
            signOut: signOutMock,
          },
        },
        {
          provide: SupabaseSessionService,
          useValue: {
            clearPasswordRecoveryPending: clearPasswordRecoveryPendingMock,
            isReady: () => ready(),
            passwordRecoveryPending: () => passwordRecoveryPending(),
            user: () => currentUser(),
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
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(AuthUpdatePasswordComponent);
    fixture.detectChanges();
  });

  it('blocks the form and shows an instruction when there is no recovery session', () => {
    currentUser.set(null);
    fixture.detectChanges();

    expect(fixture.componentInstance.recoveryIssue()).toBe(
      'This password reset link is no longer active.'
    );
    expect(fixture.componentInstance.isDisabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('reset link');
  });

  it('updates the password, signs out, and redirects to auth on success', async () => {
    passwordRecoveryPending.set(true);
    fixture.componentInstance.form.setValue({
      password: 'Updated123!',
      confirmPassword: 'Updated123!',
    });

    await fixture.componentInstance.handleSubmit();

    expect(updatePasswordMock).toHaveBeenCalledWith('Updated123!');
    expect(signOutMock).toHaveBeenCalledOnce();
    expect(clearPasswordRecoveryPendingMock).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/auth'], {
      queryParams: { passwordChanged: 1 },
    });
  });
});

function createUser(): User {
  return {
    id: 'user-1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-03-10T00:00:00.000Z',
    email: 'user@tickist.dev',
  } as User;
}
