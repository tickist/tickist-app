import { DOCUMENT } from '@angular/common';
import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { readSupabaseEnv } from '../../../environments/environment.util';
import { z } from 'zod';

export const ANALYTICS_CHOICE_KEY = 'tickist.analytics-choice.v1';

const CHOICE_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;

const savedChoiceSchema = z.object({
  accepted: z.boolean(),
  expiresAt: z.number().finite(),
});

@Injectable({ providedIn: 'root' })
export class AnalyticsConsentService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly browser = this.document.defaultView;
  private readonly token = readSupabaseEnv('NG_APP_CLOUDFLARE_ANALYTICS_TOKEN');
  readonly configured = /^[a-f0-9]{32}$/i.test(this.token);
  readonly choice = signal<boolean | null>(null);
  readonly expanded = signal(false);
  private loaded = false;

  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key === ANALYTICS_CHOICE_KEY || event.key === null) {
      this.applyChoice(this.readChoice());
    }
  };

  constructor() {
    this.applyChoice(this.readChoice());
    this.browser?.addEventListener('storage', this.onStorage);
  }

  choose(accepted: boolean): void {
    try {
      this.browser?.localStorage.setItem(
        ANALYTICS_CHOICE_KEY,
        JSON.stringify({ accepted, expiresAt: Date.now() + CHOICE_LIFETIME_MS })
      );
    } catch {
      // A blocked storage area must not prevent refusal or a session-only choice.
    }

    this.expanded.set(false);
    this.applyChoice(accepted);
  }

  ngOnDestroy(): void {
    this.browser?.removeEventListener('storage', this.onStorage);
  }

  private readChoice(): boolean | null {
    if (
      this.browser &&
      new URL(this.browser.location.href).searchParams.get(
        'tickist_analytics'
      ) === 'off'
    ) {
      return false;
    }

    try {
      const raw = this.browser?.localStorage.getItem(ANALYTICS_CHOICE_KEY);

      if (!raw) return null;

      const result = savedChoiceSchema.safeParse(JSON.parse(raw));

      if (!result.success || result.data.expiresAt <= Date.now()) return null;

      return result.data.accepted;
    } catch {
      return null;
    }
  }

  private applyChoice(value: boolean | null): void {
    this.choice.set(value);

    if (value !== true && this.loaded) {
      // Removing a script does not remove its listeners; reload stops the beacon.
      if (this.browser) {
        const url = new URL(this.browser.location.href);
        url.searchParams.set('tickist_analytics', 'off');
        this.browser.location.replace(url.toString());
      }

      return;
    }

    if (value !== true || this.loaded || !this.configured) return;

    if (this.browser) {
      const url = new URL(this.browser.location.href);

      if (url.searchParams.has('tickist_analytics')) {
        url.searchParams.delete('tickist_analytics');
        this.browser.history.replaceState(this.browser.history.state, '', url);
      }
    }

    const script = this.document.createElement('script');
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.defer = true;
    script.setAttribute(
      'data-cf-beacon',
      JSON.stringify({ token: this.token })
    );
    script.setAttribute('data-tickist-analytics', '');
    this.document.head.appendChild(script);
    this.loaded = true;
  }
}
