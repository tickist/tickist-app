import { Component, computed, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { ToastService } from '../../core/ui/toast.service';

type SettingsTab = 'account' | 'password' | 'notifications';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  private readonly session = inject(SupabaseSessionService);
  private readonly fb = inject(FormBuilder);
  private readonly toasts = inject(ToastService);

  readonly user = computed(() => this.session.user());
  readonly activeTab = signal<SettingsTab>('account');
  readonly updating = signal(false);
  readonly accountForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: [{ value: '', disabled: true }],
  });

  constructor() {
    const user = this.user();
    this.accountForm.patchValue({
      displayName:
        (user?.user_metadata as Record<string, unknown>)?.['full_name']?.toString() ??
        user?.email ??
        '',
      email: user?.email ?? '',
    });
  }

  select(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  async saveAccount(): Promise<void> {
    const user = this.user();
    if (!user) {
      this.toasts.error('You must be signed in.');
      return;
    }
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }
    this.updating.set(true);
    try {
      const fullName = this.accountForm.value.displayName?.trim() ?? '';
      const client = this.session.client();
      if (!client) {
        throw new Error('Supabase client not available');
      }
      const { error } = await client.auth.updateUser({
        data: { full_name: fullName },
      });
      if (error) {
        throw error;
      }
      this.toasts.success('Display name updated.');
    } catch (error) {
      console.error('[Settings] failed to update account', error);
      this.toasts.error('Could not update account.');
    } finally {
      this.updating.set(false);
    }
  }

  async deleteAccount(): Promise<void> {
    this.toasts.error('Account removal is not enabled in this build.');
  }
}
