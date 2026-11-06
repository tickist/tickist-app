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
  // Explicit styles: daisyUI 5 button variants are unreliable on Tailwind 3.
  styles: `
    .consent-choice {
      height: 2.25rem;
      border-radius: 0.5rem;
      border: 1px solid
        color-mix(in oklab, var(--color-base-content) 22%, transparent);
      background: transparent;
      color: var(--color-base-content);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .consent-choice:hover {
      background: color-mix(in oklab, var(--color-base-content) 8%, transparent);
      border-color: color-mix(
        in oklab,
        var(--color-base-content) 40%,
        transparent
      );
    }
    .consent-choice[aria-pressed='true'] {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-primary-content);
    }
    .consent-choice:focus-visible,
    .consent-close:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
    .consent-close {
      float: right;
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      margin: -0.5rem -0.5rem 0 0.5rem;
      border-radius: 9999px;
      color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
      cursor: pointer;
    }
    .consent-close:hover {
      background: color-mix(in oklab, var(--color-base-content) 10%, transparent);
      color: var(--color-base-content);
    }
  `,
  template: `
    @if (showCloudflare() || showGoogle()) {
    <div
      class="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto rounded-xl border border-base-300 bg-base-100 p-4 shadow-xl"
    >
      @if (canClose()) {
      <button
        class="consent-close"
        type="button"
        aria-label="Close privacy settings"
        (click)="closeSettings()"
      >
        ✕
      </button>
      } @if (showCloudflare()) {
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
        <div class="mt-3 grid grid-cols-2 gap-2 sm:max-w-xs">
          <button
            class="consent-choice"
            type="button"
            aria-label="Refuse analytics"
            [attr.aria-pressed]="consent.choice() === false"
            (click)="consent.choose(false)"
          >
            Refuse
          </button>
          <button
            class="consent-choice"
            type="button"
            aria-label="Allow analytics"
            [attr.aria-pressed]="consent.choice() === true"
            (click)="consent.choose(true)"
          >
            Allow
          </button>
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
        <div class="mt-3 grid grid-cols-2 gap-2 sm:max-w-xs">
          <button
            class="consent-choice"
            type="button"
            aria-label="Refuse Google Analytics"
            [attr.aria-pressed]="google.choice() === false"
            (click)="google.choose(false)"
          >
            Refuse
          </button>
          <button
            class="consent-choice"
            type="button"
            aria-label="Allow Google Analytics"
            [attr.aria-pressed]="google.choice() === true"
            (click)="google.choose(true)"
          >
            Allow
          </button>
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
  /** A first decision stays on screen until it is made. */
  canClose(): boolean {
    return (
      (this.showCloudflare() && this.consent.choice() !== null) ||
      (this.showGoogle() && this.google.choice() !== null)
    );
  }
  closeSettings(): void {
    this.consent.expanded.set(false);
    this.google.expanded.set(false);
  }
  openSettings(): void {
    this.consent.expanded.set(true);
    this.google.expanded.set(true);
  }
}
