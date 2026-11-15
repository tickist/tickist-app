import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';

/**
 * Tells the user when the browser loses its connection. The installed app
 * still opens from the service worker cache, but data comes from Supabase, so
 * without this notice an offline start looks like an empty or broken app.
 */
@Component({
  selector: 'app-offline-notice',
  standalone: true,
  template: `
    <div class="offline-notice" role="status">
      @if (offline()) {
      <p class="offline-notice__message" data-testid="offline-notice">
        You're offline. Changes won't be saved until you reconnect.
      </p>
      }
    </div>
  `,
  styleUrl: './offline-notice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineNoticeComponent {
  protected readonly offline = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const update = () => this.offline.set(!navigator.onLine);

      update();
      window.addEventListener('online', update);
      window.addEventListener('offline', update);
      destroyRef.onDestroy(() => {
        window.removeEventListener('online', update);
        window.removeEventListener('offline', update);
      });
    });
  }
}
