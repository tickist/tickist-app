import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseAuthService } from './supabase-auth.service';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../core/ui/theme.service';

@Component({
  selector: 'app-auth-signup',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, RouterLink],
  templateUrl: './auth-signup.component.html',
  styleUrl: './auth-signup.component.css',
})
export class AuthSignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(SupabaseAuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', [Validators.required]],
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
    const { email, password, confirm } = this.form.getRawValue();
    if (password !== confirm) {
      this.message.set({
        type: 'error',
        text: 'Passwords must match.',
      });
      return;
    }
    this.isSubmitting.set(true);
    this.message.set(null);
    try {
      const response = await this.auth.signUpWithPassword({ email, password });
      if (response.error) {
        throw response.error;
      }
      this.message.set({
        type: 'success',
        text: 'Check your inbox to confirm the account.',
      });
      setTimeout(() => this.router.navigateByUrl('/auth'), 1500);
    } catch (error) {
      this.message.set({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unexpected error during sign up.',
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
