import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SupabaseAuthService } from './supabase-auth.service';
import { NgClass, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgClass, RouterLink],
  templateUrl: './auth-shell.component.html',
  styleUrl: './auth-shell.component.css',
})
export class AuthShellComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(SupabaseAuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly isSubmitting = signal(false);
  readonly message = signal<{ type: 'success' | 'error'; text: string } | null>(
    null
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
      const { email, password } = this.form.getRawValue();
      const response = await this.auth.signInWithPassword({ email, password });
      if (response.error) {
        throw response.error;
      }
      this.message.set({
        type: 'success',
        text: 'Signed in successfully. Redirecting…',
      });
      await this.router.navigateByUrl('/app');
    } catch (error) {
      this.message.set({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unexpected error during sign in.',
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
