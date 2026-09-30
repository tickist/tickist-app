import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsConsentService } from './analytics-consent.service';
import {
  GA4_PRIVACY_VERSION,
  GoogleAnalyticsService,
} from './google-analytics.service';

@Component({
  selector: 'app-analytics-consent',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showCloudflare() || showGoogle()) {
    <div
      class="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto rounded-xl border border-base-300 bg-base-100 p-4 shadow-xl"
    >
      @if (showCloudflare()) {
      <section
        aria-label="Cloudflare privacy settings"
        data-testid="analytics-consent"
      >
        <h2 class="font-semibold">Optional performance measurement</h2>
        <p class="mt-2 text-sm">
          May Tickist use Cloudflare Web Analytics to measure visits and
          performance, including signed-in pages? It receives page addresses
          (including project IDs) and technical measurements. Your choice does
          not affect access to features.
        </p>
        <a
          routerLink="/legal/privacy"
          class="mt-2 inline-block text-sm underline"
          >Privacy policy</a
        >
        @if (consent.choice() === true) {
        <p class="mt-2 text-sm">
          Refusing will reload this page to stop measurement. Save any
          unfinished edits first.
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
          <button
            class="btn btn-sm"
            type="button"
            (click)="consent.choose(true)"
          >
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
      } @if (showGoogle()) {
      <section
        aria-label="Google Analytics privacy settings"
        class="mt-4 border-t border-base-300 pt-4 first:mt-0 first:border-0 first:pt-0"
        data-testid="google-analytics-consent"
      >
        <h2 class="font-semibold">Optional Google Analytics</h2>
        <p class="mt-2 text-sm">
          May Tickist use Google Analytics to measure page visits, registrations
          and app usage? Google receives general view names and browser
          measurements, and stores analytics cookies for up to 180 days. Task
          content, email addresses and project IDs are excluded. This choice is
          separate from Cloudflare and does not affect access to features.
        </p>
        <a
          [routerLink]="['/legal/privacy', gaPrivacyVersion]"
          class="mt-2 inline-block text-sm underline"
          >Google Analytics privacy details</a
        >
        @if (google.choice() === true) {
        <p class="mt-2 text-sm">
          Refusing will reload this page to stop measurement. Save any
          unfinished edits first.
        </p>
        }
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            class="btn btn-sm"
            type="button"
            (click)="google.choose(false)"
          >
            Refuse Google Analytics
          </button>
          <button
            class="btn btn-sm"
            type="button"
            (click)="google.choose(true)"
          >
            Allow Google Analytics
          </button>
          @if (google.choice() !== null) {
          <button
            class="btn btn-ghost btn-sm"
            type="button"
            (click)="google.expanded.set(false)"
          >
            Close Google Analytics settings
          </button>
          }
        </div>
      </section>
      }
    </div>
    } @else if (consent.configured || google.configured()) {
    <button
      class="fixed bottom-2 left-2 z-[60] rounded bg-base-100 px-2 py-1 text-xs underline shadow"
      type="button"
      (click)="openSettings()"
    >
      Privacy settings
    </button>
    }
  `,
})
export class AnalyticsConsentComponent {
  readonly consent = inject(AnalyticsConsentService);
  readonly google = inject(GoogleAnalyticsService);
  readonly gaPrivacyVersion = GA4_PRIVACY_VERSION;
  showCloudflare(): boolean {
    return (
      this.consent.configured &&
      (this.consent.choice() === null || this.consent.expanded())
    );
  }
  showGoogle(): boolean {
    return (
      this.google.configured() &&
      (this.google.choice() === null || this.google.expanded())
    );
  }
  openSettings(): void {
    this.consent.expanded.set(true);
    this.google.expanded.set(true);
  }
}
