import { DOCUMENT } from '@angular/common';
import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { z } from 'zod';
import { readSupabaseEnv } from '../../../environments/environment.util';
import { LegalDocumentService } from '../../features/legal/legal-document.service';

export const GOOGLE_ANALYTICS_CHOICE_KEY = 'tickist.google-analytics-choice.v1';

export const GA4_PRIVACY_VERSION = '2026-09-30.2';

const CHOICE_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;

const savedChoiceSchema = z.object({
  accepted: z.boolean(),
  expiresAt: z.number().finite(),
});

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
};

// Only fixed route templates reach Google; no user-generated path segments.
export function analyticsPage(path: string) {
  const pathname = path.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';

  const pages: Array<[RegExp, string, string]> = [
    [/^\/$/, '/', 'Tickist'],
    [/^\/app$/, '/app', 'Dashboard'],
    [/^\/app\/tasks$/, '/app/tasks', 'Tasks'],
    [/^\/app\/tasks\/[^/]+$/, '/app/tasks/project', 'Project tasks'],
    [/^\/app\/task\/new$/, '/app/task/new', 'New task'],
    [/^\/app\/task\/[^/]+\/edit$/, '/app/task/edit', 'Edit task'],
    [/^\/app\/project\/new$/, '/app/project/new', 'New project'],
    [/^\/app\/project\/[^/]+\/edit$/, '/app/project/edit', 'Edit project'],
    [/^\/app\/tree$/, '/app/tree', 'Task tree'],
    [/^\/app\/stats$/, '/app/stats', 'Statistics'],
    [/^\/app\/team$/, '/app/team', 'Team'],
    [/^\/app\/tags$/, '/app/tags', 'Tags'],
    [/^\/app\/settings(?:\/connected-apps)?$/, '/app/settings', 'Settings'],
    [/^\/auth\/signup$/, '/auth/signup', 'Sign up'],
    [/^\/auth(?:\/[^/]+)*$/, '/auth', 'Authentication'],
    [/^\/legal\/(terms|privacy)(?:\/[^/]+)?$/, '/legal', 'Legal documents'],
    [/^\/(en|pl)\/blog(?:\/[^/]+)*$/, '/blog', 'Blog'],
  ];

  const page = pages.find(([pattern]) => pattern.test(pathname));

  return {
    location: `https://tickist.com${page?.[1] ?? '/other'}`,
    title: page?.[2] ?? 'Other page',
  };
}

export function analyticsReferrer(referrer: string): string {
  const allowedHosts = new Set([
    'www.google.com',
    'www.google.pl',
    'www.bing.com',
    'duckduckgo.com',
    'www.facebook.com',
    'l.facebook.com',
    'www.instagram.com',
    'www.linkedin.com',
    't.co',
  ]);

  try {
    const url = new URL(referrer);

    return url.protocol === 'https:' &&
      allowedHosts.has(url.hostname) &&
      !url.port
      ? `https://${url.hostname}/`
      : '';
  } catch {
    return '';
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleAnalyticsService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  // SAFETY: defaultView is a browser Window; the optional tag queue is checked with Array.isArray before use.
  private readonly browser = this.document
    .defaultView as AnalyticsWindow | null;
  private readonly referrer = analyticsReferrer(this.document.referrer ?? '');
  private readonly router = inject(Router);
  private readonly legal = inject(LegalDocumentService);
  private readonly measurementId = readSupabaseEnv('NG_APP_GA4_MEASUREMENT_ID');
  readonly configured = signal(false);
  readonly choice = signal<boolean | null>(null);
  readonly expanded = signal(false);
  private loaded = false;
  private destroyed = false;
  private expiresAt = 0;
  private expiryTimer?: ReturnType<typeof setTimeout>;
  private appOpened = false;
  private readonly navigation: Subscription;

  private readonly onStorage = (event: StorageEvent): void => {
    if (
      this.configured() &&
      (event.key === GOOGLE_ANALYTICS_CHOICE_KEY || event.key === null)
    ) {
      this.applyChoice(this.readChoice());
    }
  };

  constructor() {
    this.navigation = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.recordPage(event.urlAfterRedirects);
    });
    this.browser?.addEventListener('storage', this.onStorage);

    if (this.browser && /^G-[A-Z0-9]{6,20}$/.test(this.measurementId)) {
      this.disableCollection(true);
      void this.configure();
    }
  }

  private async configure(): Promise<void> {
    try {
      // Fail closed until the matching disclosure is actually published.
      const release = await this.legal.load(GA4_PRIVACY_VERSION);

      if (
        this.destroyed ||
        release?.version !== GA4_PRIVACY_VERSION ||
        !release.privacy_text.includes('Google Analytics')
      )
        return;
      this.configured.set(true);
      this.applyChoice(this.readChoice());
    } catch {
      // An unavailable privacy document must never enable collection.
    }
  }

  choose(accepted: boolean): void {
    if (!this.configured()) return;
    this.expiresAt = Date.now() + CHOICE_LIFETIME_MS;

    try {
      this.browser?.localStorage.setItem(
        GOOGLE_ANALYTICS_CHOICE_KEY,
        JSON.stringify({ accepted, expiresAt: this.expiresAt })
      );
    } catch {
      // Refusal and a session-only choice work when storage is unavailable.
    }

    this.expanded.set(false);
    this.applyChoice(accepted);
  }

  recordSignUp(): void {
    if (!this.canRecord()) return;
    this.command('event', 'sign_up', {
      method: 'email',
      ...this.pageParameters(this.router.url),
    });
  }

  private readChoice(): boolean | null {
    if (!this.browser) return null;

    const override = new URL(this.browser.location.href).searchParams.get(
      'tickist_ga'
    );

    if (override === 'off') return false;

    if (override === 'expired') return null;

    try {
      const raw = this.browser.localStorage.getItem(
        GOOGLE_ANALYTICS_CHOICE_KEY
      );

      if (!raw) return null;
      const result = savedChoiceSchema.safeParse(JSON.parse(raw));

      if (!result.success || result.data.expiresAt <= Date.now()) return null;
      this.expiresAt = result.data.expiresAt;

      return result.data.accepted;
    } catch {
      return null;
    }
  }

  private applyChoice(value: boolean | null): void {
    this.choice.set(value);
    clearTimeout(this.expiryTimer);

    if (value !== true) {
      this.disableCollection(true);
      this.clearCookies();

      if (this.loaded && this.browser) {
        const url = new URL(this.browser.location.href);
        url.searchParams.set('tickist_ga', value === null ? 'expired' : 'off');
        this.browser.location.replace(url.toString());
      }

      return;
    }

    if (!this.configured() || !this.browser) return;
    this.scheduleExpiry();

    if (this.loaded) return;
    const url = new URL(this.browser.location.href);

    if (url.searchParams.has('tickist_ga')) {
      url.searchParams.delete('tickist_ga');
      this.browser.history.replaceState(this.browser.history.state, '', url);
    }

    this.disableCollection(false);
    this.browser.dataLayer = Array.isArray(this.browser.dataLayer)
      ? this.browser.dataLayer
      : [];
    this.command('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    this.command('set', {
      ...this.pageParameters(this.router.url),
      ads_data_redaction: true,
      url_passthrough: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    this.command('consent', 'update', { analytics_storage: 'granted' });
    this.command('js', new Date());
    this.command('config', this.measurementId, {
      send_page_view: false,
      cookie_domain: 'none',
      cookie_expires: CHOICE_LIFETIME_MS / 1000,
      cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure',
    });
    const script = this.document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.setAttribute('data-tickist-google-analytics', '');
    this.loaded = true;
    this.document.head.appendChild(script);

    if (this.router.navigated) this.recordPage(this.router.url);
  }

  private pageParameters(path: string) {
    const page = analyticsPage(path);

    return {
      page_location: page.location,
      page_title: page.title,
      // Only known search/social origins survive; never their paths or queries.
      page_referrer: this.referrer,
      send_to: this.measurementId,
    };
  }

  private canRecord(): boolean {
    if (!this.configured() || !this.loaded || this.choice() !== true)
      return false;

    if (this.expiresAt <= Date.now()) {
      this.applyChoice(null);

      return false;
    }

    return true;
  }

  private recordPage(path: string): void {
    if (!this.canRecord()) return;
    const params = this.pageParameters(path);
    this.command('set', params);
    this.command('event', 'page_view', params);

    if (/^\/app(?:[/?#]|$)/.test(path) && !this.appOpened) {
      this.appOpened = true;
      this.command('event', 'app_open', params);
    }
  }

  private command(...args: unknown[]): void;
  private command(): void {
    try {
      // eslint-disable-next-line prefer-rest-params -- gtag.js requires its standard arguments object, not a rest array.
      this.browser?.dataLayer?.push(arguments);
    } catch {
      // Optional measurement must not break navigation or account creation.
    }
  }

  private disableCollection(disabled: boolean): void {
    if (this.browser)
      Reflect.set(this.browser, `ga-disable-${this.measurementId}`, disabled);
  }

  private clearCookies(): void {
    if (!this.browser) return;
    const suffix = this.measurementId.slice(2).replace(/-/g, '_');

    for (const name of ['_ga', `_ga_${suffix}`]) {
      this.document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
    }
  }

  private scheduleExpiry(): void {
    const remaining = this.expiresAt - Date.now();
    this.expiryTimer = setTimeout(() => {
      if (this.expiresAt <= Date.now()) this.applyChoice(null);
      else this.scheduleExpiry();
    }, Math.min(Math.max(remaining, 0), 24 * 60 * 60 * 1000));
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    clearTimeout(this.expiryTimer);
    this.navigation.unsubscribe();
    this.browser?.removeEventListener('storage', this.onStorage);
  }
}
