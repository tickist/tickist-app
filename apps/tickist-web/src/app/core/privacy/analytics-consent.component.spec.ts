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
    (element) => element.textContent?.trim() === name
  );

  if (!button) throw new Error(`Missing button: ${name}`);
  button.click();
}

describe('Separate analytics choices', () => {
  it('routes each permission to its own provider', async () => {
    const { root, cloudflare, google } = await setup();
    clickButton(root, 'Allow analytics');
    expect(cloudflare.choose).toHaveBeenCalledWith(true);
    expect(google.choose).not.toHaveBeenCalled();
    clickButton(root, 'Refuse Google Analytics');
    expect(google.choose).toHaveBeenCalledWith(false);
    expect(cloudflare.choose).toHaveBeenCalledTimes(1);
  });
  it('shows the new Google choice to a user who previously accepted Cloudflare', async () => {
    const { root } = await setup(true);
    expect(root.querySelector('[data-testid="analytics-consent"]')).toBeNull();
    expect(
      root.querySelector('[data-testid="google-analytics-consent"]')
    ).not.toBeNull();
    expect(
      root.querySelector(`a[href="/legal/privacy/${GA4_PRIVACY_VERSION}"]`)
    ).not.toBeNull();
  });
  it('offers no Google consent before its disclosure is published', async () => {
    const { root } = await setup(null, false);
    expect(
      root.querySelector('[data-testid="google-analytics-consent"]')
    ).toBeNull();
    expect(
      root.querySelector('[data-testid="analytics-consent"]')
    ).not.toBeNull();
  });
  it('keeps settings reachable once both decisions are saved', async () => {
    const { fixture, root, google, cloudflare } = await setup(false);
    google.choice.set(false);
    fixture.detectChanges();
    clickButton(root, 'Privacy settings');
    fixture.detectChanges();
    expect(google.expanded()).toBe(true);
    expect(cloudflare.expanded()).toBe(true);
    expect(
      root.querySelector('[data-testid="google-analytics-consent"]')
    ).not.toBeNull();
  });
});
