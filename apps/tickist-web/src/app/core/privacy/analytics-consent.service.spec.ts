import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import {
  ANALYTICS_CHOICE_KEY,
  AnalyticsConsentService,
} from './analytics-consent.service';

describe('Analytics consent', () => {
  let head: HTMLHeadElement;
  let saved: string | null;

  const replace = vi.fn();

  const storageListeners: Array<(event: StorageEvent) => void> = [];

  function setup(href = 'https://tickist.com/app/tasks/project-id') {
    globalThis.__env = { NG_APP_CLOUDFLARE_ANALYTICS_TOKEN: 'a'.repeat(32) };
    head = document.createElement('head');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: {
            head,
            createElement: (tag: string) => document.createElement(tag),
            defaultView: {
              localStorage: {
                getItem: () => saved,
                setItem: (_key: string, value: string) => {
                  saved = value;
                },
              },
              location: { href, replace },
              history: { state: null, replaceState: vi.fn() },
              addEventListener: (
                _event: string,
                fn: (event: StorageEvent) => void
              ) => storageListeners.push(fn),
              removeEventListener: vi.fn(),
            },
          },
        },
      ],
    });

    return TestBed.inject(AnalyticsConsentService);
  }

  beforeEach(() => {
    saved = null;
    replace.mockClear();
    storageListeners.length = 0;
  });
  afterEach(() => {
    globalThis.__env = undefined;
    TestBed.resetTestingModule();
  });

  it('does not load the beacon before a choice or after refusal', () => {
    const service = setup();

    expect(head.querySelector('script')).toBeNull();
    service.choose(false);

    expect(service.choice()).toBe(false);

    expect(head.querySelector('script')).toBeNull();
  });

  it('loads once after explicit consent on an authenticated project route', () => {
    const service = setup();
    service.choose(true);
    service.choose(true);

    expect(head.querySelectorAll('script')).toHaveLength(1);

    expect(head.querySelector('script')?.src).toBe(
      'https://static.cloudflareinsights.com/beacon.min.js'
    );

    expect(JSON.parse(saved ?? '{}').accepted).toBe(true);
  });

  it('treats expired and malformed saved values as no consent', () => {
    saved = JSON.stringify({ accepted: true, expiresAt: Date.now() - 1 });

    const service = setup();

    expect(service.choice()).toBeNull();

    expect(head.querySelector('script')).toBeNull();
    saved = '{bad-json';
    storageListeners[0](
      new StorageEvent('storage', { key: ANALYTICS_CHOICE_KEY })
    );

    expect(service.choice()).toBeNull();
  });

  it('reloads to stop existing beacon listeners after withdrawal', () => {
    const service = setup();
    service.choose(true);
    service.choose(false);

    expect(replace).toHaveBeenCalledWith(
      'https://tickist.com/app/tasks/project-id?tickist_analytics=off'
    );
  });

  it('honors withdrawal even if a stale accepted value remains in storage', () => {
    saved = JSON.stringify({ accepted: true, expiresAt: Date.now() + 100000 });

    const service = setup(
      'https://tickist.com/app/tasks/project-id?tickist_analytics=off'
    );

    expect(service.choice()).toBe(false);

    expect(head.querySelector('script')).toBeNull();
  });

  it('stops measurement when another tab withdraws consent', () => {
    const service = setup();
    service.choose(true);
    saved = JSON.stringify({ accepted: false, expiresAt: Date.now() + 100000 });
    storageListeners[0](
      new StorageEvent('storage', { key: ANALYTICS_CHOICE_KEY })
    );

    expect(replace).toHaveBeenCalledTimes(1);
  });
});
