import { Injectable, InjectionToken, inject } from '@angular/core';
import { registerSW } from 'virtual:pwa-register';

import { ToastService } from '../ui/toast.service';

export const REGISTER_SERVICE_WORKER = new InjectionToken<typeof registerSW>(
  'REGISTER_SERVICE_WORKER',
  { providedIn: 'root', factory: () => registerSW }
);

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly toasts = inject(ToastService);
  private readonly registerServiceWorker = inject(REGISTER_SERVICE_WORKER);
  private updateServiceWorker: (() => Promise<void>) | null = null;
  private started = false;

  start(): void {
    if (this.started || typeof window === 'undefined') {
      return;
    }

    this.started = true;
    this.updateServiceWorker = this.registerServiceWorker({
      immediate: true,
      onNeedRefresh: () => {
        this.toasts.infoWithAction(
          'A new version is available. Refresh to update.',
          'Refresh',
          () => this.applyUpdate()
        );
      },
      onRegisterError: (cause: unknown) => {
        console.error('[PWA] Service worker registration failed', cause);
      },
    });
  }

  private async applyUpdate(): Promise<void> {
    await this.updateServiceWorker?.();
  }
}
