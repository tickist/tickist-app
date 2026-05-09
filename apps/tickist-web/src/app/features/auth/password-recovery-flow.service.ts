import { Injectable, effect, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SupabaseSessionService } from './supabase-session.service';

@Injectable({
  providedIn: 'root',
})
export class PasswordRecoveryFlowService {
  private readonly router = inject(Router);
  private readonly session = inject(SupabaseSessionService);

  constructor() {
    effect(() => {
      if (!this.session.passwordRecoveryPending()) {
        return;
      }

      void this.redirectToUpdatePasswordIfNeeded(this.router.url);
    });

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event) => {
        if (!this.session.passwordRecoveryPending()) {
          return;
        }

        void this.redirectToUpdatePasswordIfNeeded(event.urlAfterRedirects);
      });
  }

  private async redirectToUpdatePasswordIfNeeded(url: string): Promise<void> {
    if (normalizeUrlPath(url) === '/auth/update-password') {
      return;
    }

    await this.router.navigateByUrl('/auth/update-password', {
      replaceUrl: true,
    });
  }
}

function normalizeUrlPath(url: string): string {
  const [path] = url.split('?');
  return path || '/';
}
