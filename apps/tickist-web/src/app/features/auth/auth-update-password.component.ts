import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseAuthService } from './supabase-auth.service';
import { ThemeService } from '../../core/ui/theme.service';
import { SupabaseSessionService } from './supabase-session.service';

@Component({
  selector: 'app-auth-update-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-update-password.component.html',
  styleUrl: './auth-update-password.component.css',
})
export class AuthUpdatePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(SupabaseAuthService);
  private readonly session = inject(SupabaseSessionService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly isSubmitting = signal(false);
  readonly message = signal<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  private readonly hashRecoveryIssue = signal<string | null>(
    this.readRecoveryIssueFromHash()
  );
  readonly recoveryIssue = computed(() => {
    const hashIssue = this.hashRecoveryIssue();
    if (hashIssue) {
      return hashIssue;
    }

    if (!this.session.isReady()) {
      return null;
    }

    if (
      !this.session.passwordRecoveryPending() ||
      !this.session.user()
    ) {
      return 'This password reset link is no longer active.';
    }

    return null;
  });
  readonly isDarkTheme = this.themeService.isDark;
  readonly themeButtonLabel = computed(() =>
    this.isDarkTheme() ? 'Switch to light theme' : 'Switch to dark theme'
  );

  constructor() {
    if (this.hashRecoveryIssue()) {
      this.session.clearPasswordRecoveryPending();
    }
  }

  get isDisabled(): boolean {
    return (
      this.form.invalid || this.isSubmitting() || Boolean(this.recoveryIssue())
    );
  }

  get passwordsMismatch(): boolean {
    const { password, confirmPassword } = this.form.getRawValue();
    return Boolean(password && confirmPassword && password !== confirmPassword);
  }

  async handleSubmit(): Promise<void> {
    if (this.isDisabled) {
      return;
    }

    const { password } = this.form.getRawValue();

    if (this.passwordsMismatch) {
      this.message.set({
        type: 'error',
        text: 'Passwords must match.',
      });
      return;
    }

    this.isSubmitting.set(true);
    this.message.set(null);

    try {
      await this.auth.updatePassword(password);
      await this.auth.signOut();
      this.session.clearPasswordRecoveryPending();
      this.message.set({
        type: 'success',
        text: 'Password updated. Redirecting to sign in...',
      });
      await this.router.navigate(['/auth'], {
        queryParams: { passwordChanged: 1 },
      });
    } catch (error) {
      this.message.set({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unexpected error while updating password.',
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private readRecoveryIssueFromHash(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;

    if (!hash) {
      return null;
    }

    const params = new URLSearchParams(hash);
    const errorDescription = params.get('error_description');

    if (!errorDescription) {
      return null;
    }

    try {
      return decodeURIComponent(errorDescription.replace(/\+/g, ' '));
    } catch {
      return errorDescription;
    }
  }
}
