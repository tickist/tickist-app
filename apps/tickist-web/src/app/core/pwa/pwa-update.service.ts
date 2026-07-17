import { Injectable, inject } from '@angular/core';
import { registerSW } from 'virtual:pwa-register';

import { ToastService } from '../ui/toast.service';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly toasts = inject(ToastService);
  private updateServiceWorker: (() => Promise<void>) | null = null;
  private started = false;

  start(): void {
    if (this.started || typeof window === 'undefined') {
      return;
    }

    this.started = true;
    this.updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh: () => {
        this.toasts.infoWithAction(
          'A new version is available. Refresh to update.',
          'Refresh',
          () => this.applyUpdate()
        );
      },
      onRegisterError: (error: unknown) => {
        console.error('[PWA] Service worker registration failed', error);
      },
    });
  }

  private async applyUpdate(): Promise<void> {
    await this.updateServiceWorker?.();
  }
}
