import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { LegalDocumentService } from '../../features/legal/legal-document.service';
import {
  GA4_PRIVACY_VERSION,
  GOOGLE_ANALYTICS_CHOICE_KEY,
  GoogleAnalyticsService,
  analyticsPage,
  analyticsReferrer,
} from './google-analytics.service';

const measurementId = 'G-JWF4122K8L';

const release = {
  version: GA4_PRIVACY_VERSION,
  privacy_text: 'Google Analytics',
  published_at: '2026-09-30T00:00:00Z',
};

let saved: string | null;

let head: HTMLHeadElement;

let events: Subject<NavigationEnd>;

let replaceLocation: ReturnType<typeof vi.fn>;

let storageListener: (event: StorageEvent) => void;

let storageThrows: boolean;

let cookies: string[];

let browser: ReturnType<typeof createBrowser>;

function createBrowser(href: string) {
  const dataLayer: unknown[] = [];

  return {
    dataLayer,
    'ga-disable-G-JWF4122K8L': true,
    location: { href, replace: replaceLocation },
    history: { state: null, replaceState: vi.fn() },
    localStorage: {
      getItem: (key: string) =>
        key === GOOGLE_ANALYTICS_CHOICE_KEY
          ? saved
          : JSON.stringify({ accepted: true, expiresAt: Date.now() + 100000 }),
      setItem: (_key: string, value: string) => {
        if (storageThrows) throw new Error('Storage unavailable');
        saved = value;
      },
    },
    addEventListener: (
      _name: string,
      callback: (event: StorageEvent) => void
    ) => {
      storageListener = callback;
    },
    removeEventListener: vi.fn(),
  };
}

async function setup(
  options: {
    href?: string;
    id?: string;
    legal?: typeof release | null;
    failingLegal?: boolean;
    ssr?: boolean;
  } = {}
) {
  globalThis.__env = { NG_APP_GA4_MEASUREMENT_ID: options.id ?? measurementId };
  head = document.createElement('head');
  events = new Subject();
  replaceLocation = vi.fn();
  cookies = [];

  const href =
    options.href ??
    'https://tickist.com/app/tasks/private-project?token=secret#private';

  browser = createBrowser(href);

  const documentStub = {
    head,
    createElement: (tag: string) => document.createElement(tag),
    defaultView: options.ssr ? null : browser,
    set cookie(value: string) {
      cookies.push(value);
    },
  };

  const load = vi.fn(async () => {
    if (options.failingLegal) throw new Error('Unavailable');

    return 'legal' in options ? options.legal : release;
  });

  TestBed.configureTestingModule({
    providers: [
      { provide: DOCUMENT, useValue: documentStub },
      {
        provide: Router,
        useValue: {
          events,
          url: new URL(href).pathname + new URL(href).search,
          navigated: true,
        },
      },
      { provide: LegalDocumentService, useValue: { load } },
    ],
  });
  const service = TestBed.inject(GoogleAnalyticsService);
  await Promise.resolve();
  await Promise.resolve();

  return { service, load };
}

function commands(): unknown[][] {
  return browser.dataLayer.map((value) => {
    // SAFETY: GoogleAnalyticsService.command pushes its standard arguments object into this isolated queue.
    return Array.from(value as IArguments);
  });
}

function recordedEvents(): unknown[][] {
  return commands().filter(([command]) => command === 'event');
}

beforeEach(() => {
  saved = null;
  storageThrows = false;
});

afterEach(() => {
  TestBed.resetTestingModule();
  globalThis.__env = undefined;
  vi.useRealTimers();
});

describe('Google Analytics consent and privacy', () => {
  it('requires a separate choice even when Cloudflare has consent', async () => {
    const { service } = await setup();
    expect(service.configured()).toBe(true);
    expect(service.choice()).toBeNull();
    expect(head.querySelector('script')).toBeNull();
    service.recordSignUp();
    service.choose(false);
    events.next(new NavigationEnd(1, '/app', '/app'));
    expect(recordedEvents()).toEqual([]);
    expect(head.querySelector('script')).toBeNull();
  });
  it.each([
    null,
    { ...release, version: 'old' },
    { ...release, privacy_text: 'Cloudflare only' },
  ])(
    'blocks collection without the matching published disclosure: %j',
    async (legal) => {
      const { service } = await setup({ legal });
      service.choose(true);
      expect(service.configured()).toBe(false);
      expect(head.querySelector('script')).toBeNull();
    }
  );
  it('fails closed if loading the legal document fails', async () => {
    const { service } = await setup({ failingLegal: true });
    service.choose(true);
    expect(head.querySelector('script')).toBeNull();
  });
  it.each(['', 'UA-123-1', 'G-bad?id=secret'])(
    'does not load Google for an invalid or absent measurement ID: %s',
    async (id) => {
      const { service, load } = await setup({ id });
      service.choose(true);
      expect(load).not.toHaveBeenCalled();
      expect(head.querySelector('script')).toBeNull();
    }
  );
  it('does not load scripts or consult legal data during SSR', async () => {
    const { service, load } = await setup({ ssr: true });
    service.choose(true);
    expect(load).not.toHaveBeenCalled();
    expect(head.querySelector('script')).toBeNull();
  });
  it('loads once after consent, with advertising denied and automatic page views disabled', async () => {
    const { service } = await setup();
    service.choose(true);
    service.choose(true);
    expect(head.querySelectorAll('script')).toHaveLength(1);
    expect(head.querySelector('script')?.src).toBe(
      `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    );
    expect(head.querySelector('script')?.referrerPolicy).toBe('no-referrer');
    expect(commands()).toContainEqual([
      'consent',
      'default',
      {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      },
    ]);
    expect(commands()).toContainEqual([
      'consent',
      'update',
      { analytics_storage: 'granted' },
    ]);
    expect(commands()).toContainEqual([
      'config',
      measurementId,
      expect.objectContaining({
        send_page_view: false,
        cookie_domain: 'none',
        cookie_update: false,
        cookie_expires: 15552000,
      }),
    ]);
    expect(commands()).toContainEqual([
      'set',
      expect.objectContaining({
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      }),
    ]);
    expect(
      recordedEvents().filter(([, name]) => name === 'app_open')
    ).toHaveLength(1);
  });
  it('sanitizes SPA pages, authentication tokens, titles and signup data', async () => {
    const { service } = await setup();
    service.choose(true);
    events.next(
      new NavigationEnd(
        1,
        '/app/task/private-task/edit?email=person@private.test',
        '/app/task/private-task/edit?email=person@private.test'
      )
    );
    service.recordSignUp();
    const output = JSON.stringify(commands());

    for (const forbidden of [
      'private-project',
      'private-task',
      'secret',
      'person@private.test',
    ])
      expect(output).not.toContain(forbidden);
    expect(recordedEvents()).toContainEqual([
      'event',
      'page_view',
      expect.objectContaining({
        page_location: 'https://tickist.com/app/task/edit',
        page_title: 'Edit task',
        page_referrer: '',
      }),
    ]);
    expect(recordedEvents()).toContainEqual([
      'event',
      'sign_up',
      expect.objectContaining({ method: 'email' }),
    ]);
  });
  it('does not break signup when the external tag queue fails', async () => {
    const { service } = await setup();
    service.choose(true);

    if (!browser.dataLayer) throw new Error('Missing tag queue');
    vi.spyOn(browser.dataLayer, 'push').mockImplementation(() => {
      throw new Error('Tag blocked');
    });
    expect(() => service.recordSignUp()).not.toThrow();
  });
  it('restores valid consent but does not replay events from before consent', async () => {
    saved = JSON.stringify({ accepted: true, expiresAt: Date.now() + 100000 });
    const { service } = await setup();
    expect(service.choice()).toBe(true);
    expect(head.querySelector('script')).not.toBeNull();
    expect(
      recordedEvents().filter(([, name]) => name === 'sign_up')
    ).toHaveLength(0);
  });
  it.each(['{bad-json', JSON.stringify({ accepted: true, expiresAt: 0 })])(
    'requires consent again for malformed or expired records: %s',
    async (value) => {
      saved = value;
      const { service } = await setup();
      expect(service.choice()).toBeNull();
      expect(head.querySelector('script')).toBeNull();
    }
  );
  it('disables collection, clears only its cookies and reloads after withdrawal', async () => {
    const { service } = await setup();
    service.choose(true);
    const before = recordedEvents().length;
    service.choose(false);
    service.recordSignUp();
    events.next(new NavigationEnd(2, '/app', '/app'));
    expect(browser['ga-disable-G-JWF4122K8L']).toBe(true);
    expect(recordedEvents()).toHaveLength(before);
    expect(cookies).toContain('_ga=; Max-Age=0; Path=/; SameSite=Lax; Secure');
    expect(cookies).toContain(
      '_ga_JWF4122K8L=; Max-Age=0; Path=/; SameSite=Lax; Secure'
    );
    expect(replaceLocation).toHaveBeenCalledWith(
      'https://tickist.com/app/tasks/private-project?token=secret&tickist_ga=off#private'
    );
  });
  it('honors withdrawal when storage is unavailable or stale', async () => {
    saved = JSON.stringify({ accepted: true, expiresAt: Date.now() + 100000 });

    const { service } = await setup({
      href: 'https://tickist.com/app?tickist_ga=off',
    });

    expect(service.choice()).toBe(false);
    expect(head.querySelector('script')).toBeNull();
    storageThrows = true;
    service.choose(true);
    service.choose(false);
    expect(replaceLocation).toHaveBeenCalled();
  });
  it('stops when another tab withdraws consent', async () => {
    const { service } = await setup();
    service.choose(true);
    saved = JSON.stringify({ accepted: false, expiresAt: Date.now() + 100000 });
    storageListener(
      new StorageEvent('storage', { key: GOOGLE_ANALYTICS_CHOICE_KEY })
    );
    expect(service.choice()).toBe(false);
    expect(replaceLocation).toHaveBeenCalledOnce();
  });
  it('expires consent in a long-running page without sending another event', async () => {
    vi.useFakeTimers();
    saved = JSON.stringify({ accepted: true, expiresAt: Date.now() + 1000 });
    const { service } = await setup();
    const before = recordedEvents().length;
    vi.advanceTimersByTime(1001);
    service.recordSignUp();
    expect(service.choice()).toBeNull();
    expect(recordedEvents()).toHaveLength(before);
    expect(replaceLocation.mock.calls[0][0]).toContain('tickist_ga=expired');
  });
});

describe('Analytics route boundaries', () => {
  it.each([
    [
      '/app/tasks/customer@example.test?token=secret#title',
      '/app/tasks/project',
    ],
    ['/auth/update-password#access_token=secret', '/auth'],
    ['/auth/signup?email=person@example.test', '/auth/signup'],
    ['/pl/blog/customer-name?search=private', '/blog'],
    ['/unrecognized/customer@example.test', '/other'],
    ['/', '/'],
  ])('maps %s to a fixed template %s', (path, safePath) => {
    expect(analyticsPage(path).location).toBe(`https://tickist.com${safePath}`);
  });
});

describe('Coarse referrer attribution', () => {
  it.each([
    [
      'https://www.google.com/search?q=person@example.test#secret',
      'https://www.google.com/',
    ],
    ['https://l.facebook.com/l.php?u=secret', 'https://l.facebook.com/'],
    ['https://tickist.com/app/tasks/private-project', ''],
    ['https://private.example.test/customer', ''],
    ['https://www.google.com.attacker.test/secret', ''],
    ['not-a-url', ''],
  ])(
    'keeps only an explicitly allowed origin from %s',
    (referrer, safeOrigin) => {
      expect(analyticsReferrer(referrer)).toBe(safeOrigin);
    }
  );
});
