import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter, Router } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, LandingComponent],
      providers: [provideRouter([{ path: '', component: LandingComponent }])],
    }).compileComponents();
  });

  it('should render the landing headline', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector('[data-testid="landing-title"]')?.textContent
    ).toContain('clear next action');
  });

  it('should link to Spendist from the landing page', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector(
      '[data-testid="spendist-link"]'
    ) as HTMLAnchorElement | null;

    expect(link?.href).toBe('https://spendist.app/');
    expect(link?.textContent).toContain('Visit Spendist');
  });
});
