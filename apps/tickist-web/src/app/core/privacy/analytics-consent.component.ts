import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsConsentService } from './analytics-consent.service';
import {
  GA4_PRIVACY_VERSION,
  GoogleAnalyticsService,
} from './google-analytics.service';

/**
 * One short banner asks for both optional analytics services at once
 * (Accept all / Reject all). "Customize" keeps the two consents separate,
 * because Cloudflare consent must never enable Google Analytics.
 */
@Component({
  selector: 'app-analytics-consent',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Explicit styles: daisyUI 5 button variants are unreliable on Tailwind 3.
  styles: `
    .consent {
      position: fixed;
      inset-inline: 1rem;
      inset-block-end: calc(1rem + env(safe-area-inset-bottom));
      z-index: 70;
      margin-inline: auto;
      max-width: 34rem;
      max-height: calc(100dvh - 2rem);
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 1rem 1.1rem;
      border-radius: 1rem;
      border: 1px solid
        color-mix(in oklab, var(--color-base-content) 12%, transparent);
      background: color-mix(in oklab, var(--color-base-100) 92%, transparent);
      backdrop-filter: blur(12px);
      box-shadow: 0 18px 48px rgb(0 0 0 / 0.28);
      color: var(--color-base-content);
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .consent__head {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .consent__text {
      flex: 1;
      margin: 0;
    }
    .consent__text a,
    .consent__row a {
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .consent__title {
      margin: 0 0 0.25rem;
      font-size: 0.95rem;
      font-weight: 700;
    }
    .consent__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.85rem;
    }
    .consent__actions > :first-child {
      margin-inline-end: auto;
    }
    .consent-button {
      min-height: 2.25rem;
      padding: 0 1rem;
      border-radius: 999px;
      border: 1px solid
        color-mix(in oklab, var(--color-base-content) 22%, transparent);
      background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
      color: var(--color-base-content);
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .consent-button:hover {
      background: color-mix(in oklab, var(--color-base-content) 12%, transparent);
    }
    .consent-link {
      padding: 0.25rem 0;
      border: 0;
      background: none;
      color: color-mix(in oklab, var(--color-base-content) 75%, transparent);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 2px;
      cursor: pointer;
    }
    .consent-link:hover {
      color: var(--color-base-content);
    }
    .consent__rows {
      display: grid;
      gap: 0.5rem;
      margin: 0.75rem 0 0;
      padding: 0;
      list-style: none;
    }
    .consent__row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.8rem;
      border-radius: 0.75rem;
      background: color-mix(in oklab, var(--color-base-content) 5%, transparent);
    }
    .consent__row strong {
      display: block;
      font-weight: 650;
    }
    .consent__row span {
      color: color-mix(in oklab, var(--color-base-content) 72%, transparent);
      font-size: 0.8125rem;
    }
    .consent-switch {
      appearance: none;
      position: relative;
      width: 2.5rem;
      height: 1.4rem;
      border-radius: 999px;
      background: color-mix(in oklab, var(--color-base-content) 25%, transparent);
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .consent-switch::after {
      content: '';
      position: absolute;
      inset-block-start: 0.2rem;
      inset-inline-start: 0.2rem;
      width: 1rem;
      height: 1rem;
      border-radius: 999px;
      background: var(--color-base-100);
      transition: translate 0.15s ease;
    }
    .consent-switch:checked {
      background: var(--color-primary);
    }
    .consent-switch:checked::after {
      translate: 1.1rem 0;
    }
    .consent__note {
      margin: 0.6rem 0 0;
      font-size: 0.8125rem;
      color: color-mix(in oklab, var(--color-base-content) 72%, transparent);
    }
    .consent-close {
      display: grid;
      flex: none;
      place-items: center;
      width: 2rem;
      height: 2rem;
      margin: -0.4rem -0.4rem 0 0;
      border-radius: 999px;
      color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
      cursor: pointer;
    }
    .consent-close:hover {
      background: color-mix(in oklab, var(--color-base-content) 10%, transparent);
      color: var(--color-base-content);
    }
    .consent-reopen {
      position: fixed;
      inset-inline-start: max(0.5rem, env(safe-area-inset-left));
      inset-block-end: calc(0.5rem + env(safe-area-inset-bottom));
      z-index: 60;
      padding: 0.3rem 0.7rem;
      border-radius: 999px;
      border: 1px solid
        color-mix(in oklab, var(--color-base-content) 14%, transparent);
      background: color-mix(in oklab, var(--color-base-100) 90%, transparent);
      backdrop-filter: blur(8px);
      color: color-mix(in oklab, var(--color-base-content) 80%, transparent);
      font-size: 0.75rem;
      cursor: pointer;
    }
    .consent-reopen:hover {
      color: var(--color-base-content);
    }
    .consent-button:focus-visible,
    .consent-link:focus-visible,
    .consent-switch:focus-visible,
    .consent-close:focus-visible,
    .consent-reopen:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      .consent-switch,
      .consent-switch::after {
        transition: none;
      }
    }
  `,
  template: `
    @if (visible()) {
    <section
      class="consent"
      aria-labelledby="consent-title"
      data-testid="analytics-consent-banner"
    >
      <div class="consent__head">
        <div class="consent__text">
          <h2 id="consent-title" class="consent__title">
            {{ customizing() ? 'Privacy settings' : 'Optional analytics' }}
          </h2>
          @if (!customizing()) {
          <p class="consent__text">
            Tickist would like to use {{ serviceNames() }} to see how the app is
            used. Features work the same either way.
            <a routerLink="/legal/privacy">Privacy policy</a>
          </p>
          }
        </div>
        @if (canClose()) {
        <button
          class="consent-close"
          type="button"
          aria-label="Close privacy settings"
          (click)="closeSettings()"
        >
          ✕
        </button>
        }
      </div>

      @if (customizing()) {
      <ul class="consent__rows">
        @if (consent.configured) {
        <li class="consent__row" data-testid="analytics-consent">
          <label for="consent-cloudflare">
            <strong>Cloudflare Web Analytics</strong>
            <span
              >Visits and page speed, including page addresses.
              <a routerLink="/legal/privacy">Privacy policy</a></span
            >
          </label>
          <input
            id="consent-cloudflare"
            class="consent-switch"
            type="checkbox"
            role="switch"
            [checked]="cloudflareDraft()"
            (change)="cloudflareDraft.set(!cloudflareDraft())"
          />
        </li>
        } @if (google.configured()) {
        <li class="consent__row" data-testid="google-analytics-consent">
          <label for="consent-google">
            <strong>Google Analytics</strong>
            <span
              >Page views and sign-ups; cookies for up to 180 days.
              <a [routerLink]="['/legal/privacy', gaPrivacyVersion]"
                >Details</a
              ></span
            >
          </label>
          <input
            id="consent-google"
            class="consent-switch"
            type="checkbox"
            role="switch"
            [checked]="googleDraft()"
            (change)="googleDraft.set(!googleDraft())"
          />
        </li>
        }
      </ul>
      @if (withdrawing()) {
      <p class="consent__note">
        Turning measurement off reloads the page. Save unfinished edits first.
      </p>
      }
      <div class="consent__actions">
        <button class="consent-link" type="button" (click)="saveDrafts()">
          Save choices
        </button>
        <button class="consent-button" type="button" (click)="decideAll(false)">
          Reject all
        </button>
        <button class="consent-button" type="button" (click)="decideAll(true)">
          Accept all
        </button>
      </div>
      } @else {
      <div class="consent__actions">
        <button class="consent-link" type="button" (click)="customize()">
          Customize
        </button>
        <button class="consent-button" type="button" (click)="decideAll(false)">
          Reject all
        </button>
        <button class="consent-button" type="button" (click)="decideAll(true)">
          Accept all
        </button>
      </div>
      }
    </section>
    } @else if (consent.configured || google.configured()) {
    <button class="consent-reopen" type="button" (click)="openSettings()">
      Privacy settings
    </button>
    }
  `,
})
export class AnalyticsConsentComponent {
  readonly consent = inject(AnalyticsConsentService);
  readonly google = inject(GoogleAnalyticsService);
  readonly gaPrivacyVersion = GA4_PRIVACY_VERSION;

  readonly customizing = signal(false);
  readonly cloudflareDraft = signal(false);
  readonly googleDraft = signal(false);

  private readonly cloudflarePending = computed(
    () => this.consent.configured && this.consent.choice() === null
  );
  private readonly googlePending = computed(
    () => this.google.configured() && this.google.choice() === null
  );
  private readonly settingsOpen = computed(
    () => this.consent.expanded() || this.google.expanded()
  );

  readonly visible = computed(
    () =>
      this.cloudflarePending() || this.googlePending() || this.settingsOpen()
  );

  readonly serviceNames = computed(() =>
    [
      this.consent.configured ? 'Cloudflare Web Analytics' : null,
      this.google.configured() ? 'Google Analytics' : null,
    ]
      .filter((name) => name !== null)
      .join(' and ')
  );

  /** A first decision stays on screen until it is made. */
  readonly canClose = computed(
    () => !this.cloudflarePending() && !this.googlePending()
  );

  /** Unchecking a service that is measuring now reloads the page. */
  readonly withdrawing = computed(
    () =>
      (this.consent.choice() === true && !this.cloudflareDraft()) ||
      (this.google.choice() === true && !this.googleDraft())
  );

  customize(): void {
    this.cloudflareDraft.set(this.consent.choice() === true);
    this.googleDraft.set(this.google.choice() === true);
    this.customizing.set(true);
  }

  decideAll(accepted: boolean): void {
    this.apply(accepted, accepted);
  }

  saveDrafts(): void {
    this.apply(this.cloudflareDraft(), this.googleDraft());
  }

  closeSettings(): void {
    this.consent.expanded.set(false);
    this.google.expanded.set(false);
    this.customizing.set(false);
  }

  openSettings(): void {
    this.consent.expanded.set(true);
    this.google.expanded.set(true);
    this.customize();
  }

  /**
   * Saves both choices. Google goes first: a withdrawal reloads the page, and
   * each service writes its choice to storage before navigating.
   */
  private apply(cloudflare: boolean, google: boolean): void {
    if (this.google.configured()) this.google.choose(google);

    if (this.consent.configured) this.consent.choose(cloudflare);

    this.closeSettings();
  }
}
