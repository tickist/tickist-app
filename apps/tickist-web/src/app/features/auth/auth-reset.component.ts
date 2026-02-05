import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SupabaseAuthService } from './supabase-auth.service';
import { NgClass, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/ui/theme.service';

@Component({
  selector: 'app-auth-reset',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgClass, RouterLink],
  templateUrl: './auth-reset.component.html',
  styleUrl: './auth-reset.component.css',
})
export class AuthResetComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(SupabaseAuthService);
  private readonly themeService = inject(ThemeService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly isSubmitting = signal(false);
  readonly message = signal<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  readonly isDarkTheme = this.themeService.isDark;
  readonly themeButtonLabel = computed(() =>
    this.isDarkTheme() ? 'Switch to light theme' : 'Switch to dark theme'
  );

  get isDisabled(): boolean {
    return this.form.invalid || this.isSubmitting();
  }

  async handleSubmit(): Promise<void> {
    if (this.isDisabled) {
      return;
    }
    this.isSubmitting.set(true);
    this.message.set(null);
    try {
      const { email } = this.form.getRawValue();
      await this.auth.sendPasswordReset(email);
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
      this.isSubmitting.set(false);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
