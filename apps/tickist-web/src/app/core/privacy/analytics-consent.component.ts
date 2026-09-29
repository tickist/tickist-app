import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsConsentService } from './analytics-consent.service';

@Component({
  selector: 'app-analytics-consent',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (consent.configured) { @if (consent.choice() === null ||
    consent.expanded()) {
    <section
      aria-label="Privacy settings"
      class="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-xl rounded-xl border border-base-300 bg-base-100 p-4 shadow-xl"
      data-testid="analytics-consent"
    >
      <h2 class="font-semibold">Optional performance measurement</h2>
      <p class="mt-2 text-sm">
        May Tickist use Cloudflare Web Analytics to measure visits and
        performance, including signed-in pages? It receives page addresses
        (including project IDs) and technical measurements. Your choice does not
        affect access to features.
      </p>
      <a
        routerLink="/legal/privacy"
        class="mt-2 inline-block text-sm underline"
      >
        Privacy policy
      </a>
      @if (consent.choice() === true) {
      <p class="mt-2 text-sm">
        Refusing will reload this page to stop measurement. Save any unfinished
        edits first.
      </p>
      }
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          class="btn btn-sm"
          type="button"
          (click)="consent.choose(false)"
        >
          Refuse analytics
        </button>
        <button class="btn btn-sm" type="button" (click)="consent.choose(true)">
          Allow analytics
        </button>
        @if (consent.choice() !== null) {
        <button
          class="btn btn-ghost btn-sm"
          type="button"
          (click)="consent.expanded.set(false)"
        >
          Close
        </button>
        }
      </div>
    </section>
    } @else {
    <button
      class="fixed bottom-2 left-2 z-[60] rounded bg-base-100 px-2 py-1 text-xs underline shadow"
      type="button"
      (click)="consent.expanded.set(true)"
    >
      Privacy settings
    </button>
    } }
  `,
})
export class AnalyticsConsentComponent {
  readonly consent = inject(AnalyticsConsentService);
}
