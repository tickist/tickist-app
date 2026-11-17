import {
  Component,
  computed,
  inject,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { IconComponent } from '../../core/ui/icon.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseAuthService } from './supabase-auth.service';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/ui/theme.service';
import {
  CaptchaState,
  TurnstileWidgetComponent,
} from './captcha/turnstile-widget.component';

@Component({
  selector: 'app-auth-reset',
  standalone: true,
  imports: [
    IconComponent,
    ReactiveFormsModule,
    NgClass,
    RouterLink,
    TurnstileWidgetComponent,
  ],
  templateUrl: './auth-reset.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth-reset.component.css',
})
export class AuthResetComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(SupabaseAuthService);
  private readonly themeService = inject(ThemeService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly captcha = new CaptchaState();
  private readonly captchaWidget = viewChild(TurnstileWidgetComponent);
  readonly isSubmitting = signal(false);
  readonly message = signal<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  readonly isDarkTheme = this.themeService.isDark;
  readonly themeButtonLabel = computed(() =>
    this.isDarkTheme() ? 'Switch to light theme' : 'Switch to dark theme'
  );

  /** The submit button stays enabled for an incomplete form, which shows
   * its field errors on submit instead. */
  get isDisabled(): boolean {
    return this.isSubmitting() || !this.captcha.ready();
  }

  async handleSubmit(): Promise<void> {
    if (this.isDisabled) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.set({ type: 'error', text: 'Enter a valid email address.' });

      return;
    }

    this.isSubmitting.set(true);
    this.message.set(null);

    try {
      const { email } = this.form.getRawValue();
      await this.auth.sendPasswordReset(email, this.captcha.token());
      this.message.set({
        type: 'success',
        text: 'Password reset link sent. Check your inbox.',
      });
    } catch (error) {
      this.message.set({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unexpected error during password reset.',
      });
    } finally {
      this.captchaWidget()?.reset();
      this.isSubmitting.set(false);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
