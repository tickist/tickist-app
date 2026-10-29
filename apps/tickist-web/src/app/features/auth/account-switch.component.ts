import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthCallbackService } from './auth-callback.service';
import { SupabaseSessionService } from './supabase-session.service';

// Shown before an email link replaces the account that is already signed in.
@Component({
  selector: 'app-account-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (callback.accountSwitch(); as request) {
    <section
      class="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-white/10 bg-base-200/60 p-8 shadow-2xl shadow-black/30 backdrop-blur"
      role="alertdialog"
      aria-labelledby="account-switch-title"
      aria-describedby="account-switch-description"
    >
      <header class="space-y-2 text-center">
        <h1
          id="account-switch-title"
          class="text-2xl font-semibold text-base-content"
        >
          You are already signed in
        </h1>
        <p id="account-switch-description" class="text-sm text-base-content/70">
          You are signed in as {{ request.currentEmail }}. This link belongs to
          another account. Continuing signs you out of the current account
          first.
        </p>
      </header>
      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="btn btn-ghost"
          [disabled]="busy()"
          (click)="stay()"
        >
          Stay signed in
        </button>
        <button
          type="button"
          class="btn btn-primary"
          [disabled]="busy()"
          (click)="switchAccount()"
        >
          Sign out and continue
        </button>
      </div>
    </section>
    }
  `,
})
export class AccountSwitchComponent implements OnInit {
  protected readonly callback = inject(AuthCallbackService);
  private readonly session = inject(SupabaseSessionService);
  private readonly router = inject(Router);

  protected readonly busy = signal(false);

  ngOnInit(): void {
    if (!this.callback.accountSwitch()) {
      void this.router.navigateByUrl(this.session.user() ? '/app' : '/auth', {
        replaceUrl: true,
      });
    }
  }

  protected async stay(): Promise<void> {
    this.callback.cancelAccountSwitch();
    await this.router.navigateByUrl('/app', { replaceUrl: true });
  }

  protected async switchAccount(): Promise<void> {
    this.busy.set(true);

    try {
      const applied = await this.callback.continueWithLinkAccount();

      if (this.session.passwordRecoveryPending()) {
        await this.router.navigateByUrl('/auth/update-password', {
          replaceUrl: true,
        });

        return;
      }

      await this.router.navigateByUrl(applied ? '/app' : '/auth', {
        replaceUrl: true,
      });
    } finally {
      this.busy.set(false);
    }
  }
}
