import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsConsentComponent } from './analytics-consent.component';
import { AnalyticsConsentService } from './analytics-consent.service';
import {
  GA4_PRIVACY_VERSION,
  GoogleAnalyticsService,
} from './google-analytics.service';

async function setup(
  cloudflareChoice: boolean | null = null,
  googleConfigured = true
) {
  const cloudflare = {
    configured: true,
    choice: signal(cloudflareChoice),
    expanded: signal(false),
    choose: vi.fn(),
  };

  const google = {
    configured: signal(googleConfigured),
    choice: signal<boolean | null>(null),
    expanded: signal(false),
    choose: vi.fn(),
  };

  await TestBed.configureTestingModule({
    imports: [AnalyticsConsentComponent],
    providers: [
      provideRouter([]),
      { provide: AnalyticsConsentService, useValue: cloudflare },
      { provide: GoogleAnalyticsService, useValue: google },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(AnalyticsConsentComponent);
  fixture.detectChanges();
  const root = fixture.nativeElement;

  if (!(root instanceof HTMLElement)) throw new Error('Missing component root');

  return {
    fixture,
    cloudflare,
    google,
    root,
  };
}

function clickButton(root: HTMLElement, name: string): void {
  const button = Array.from(root.querySelectorAll('button')).find(
    (element) =>
      (element.getAttribute('aria-label') ?? element.textContent?.trim()) ===
      name
  );

  if (!button) throw new Error(`Missing button: ${name}`);
  button.click();
}

function textButton(root: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(root.querySelectorAll('button')).find(
    (element) => element.textContent?.trim() === label
  );

  if (!button) throw new Error(`Missing button: ${label}`);

  return button;
}

describe('Analytics consent banner', () => {
  it('asks once for both services with a short notice and a privacy link', async () => {
    const { root } = await setup();

    const banner = root.querySelector(
      '[data-testid="analytics-consent-banner"]'
    );

    expect(banner?.textContent).toContain(
      'Cloudflare Web Analytics and Google Analytics'
    );
    expect(root.querySelector('a[href="/legal/privacy"]')).not.toBeNull();
    expect(
      root.querySelector('button[aria-label="Close privacy settings"]')
    ).toBeNull();
  });

  it('accepts both services with one button', async () => {
    const { root, cloudflare, google } = await setup();

    textButton(root, 'Accept all').click();

    expect(cloudflare.choose).toHaveBeenCalledWith(true);
    expect(google.choose).toHaveBeenCalledWith(true);
  });

  it('rejects both services with one button', async () => {
    const { root, cloudflare, google } = await setup();

    textButton(root, 'Reject all').click();

    expect(cloudflare.choose).toHaveBeenCalledWith(false);
    expect(google.choose).toHaveBeenCalledWith(false);
  });

  it('keeps the choices separate under Customize', async () => {
    const { fixture, root, cloudflare, google } = await setup();

    textButton(root, 'Customize').click();
    fixture.detectChanges();

    const cloudflareSwitch = root.querySelector<HTMLInputElement>(
      '#consent-cloudflare'
    );

    expect(cloudflareSwitch?.checked).toBe(false);
    expect(
      root.querySelector(`a[href="/legal/privacy/${GA4_PRIVACY_VERSION}"]`)
    ).not.toBeNull();

    cloudflareSwitch?.click();
    textButton(root, 'Save choices').click();

    expect(cloudflare.choose).toHaveBeenCalledWith(true);
    expect(google.choose).toHaveBeenCalledWith(false);
  });

  it('asks a user who accepted Cloudflare earlier about the new Google choice', async () => {
    const { root } = await setup(true);

    expect(
      root.querySelector('[data-testid="analytics-consent-banner"]')
    ).not.toBeNull();
  });

  it('offers no Google consent before its disclosure is published', async () => {
    const { fixture, root } = await setup(null, false);

    const banner = root.querySelector(
      '[data-testid="analytics-consent-banner"]'
    );

    expect(banner?.textContent).not.toContain('Google');

    textButton(root, 'Customize').click();
    fixture.detectChanges();

    expect(
      root.querySelector('[data-testid="google-analytics-consent"]')
    ).toBeNull();
    expect(
      root.querySelector('[data-testid="analytics-consent"]')
    ).not.toBeNull();
  });

  it('reopens saved choices from Privacy settings and closes them again', async () => {
    const { fixture, root, google, cloudflare } = await setup(true);

    google.choice.set(false);
    fixture.detectChanges();

    expect(
      root.querySelector('[data-testid="analytics-consent-banner"]')
    ).toBeNull();

    clickButton(root, 'Privacy settings');
    fixture.detectChanges();

    expect(cloudflare.expanded()).toBe(true);
    expect(google.expanded()).toBe(true);
    expect(
      root.querySelector<HTMLInputElement>('#consent-cloudflare')?.checked
    ).toBe(true);
    expect(
      root.querySelector<HTMLInputElement>('#consent-google')?.checked
    ).toBe(false);

    clickButton(root, 'Close privacy settings');

    expect(cloudflare.expanded()).toBe(false);
    expect(google.expanded()).toBe(false);
  });

  it('warns before a withdrawal reloads the page', async () => {
    const { fixture, root } = await setup(true);

    clickButton(root, 'Customize');
    fixture.detectChanges();
    expect(root.textContent).not.toContain('reloads the page');

    root.querySelector<HTMLInputElement>('#consent-cloudflare')?.click();
    fixture.detectChanges();

    expect(root.textContent).toContain('reloads the page');
  });
});
