import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { AuthSignupComponent } from './auth-signup.component';
import { SupabaseAuthService } from './supabase-auth.service';
import {
  LegalDocumentService,
  LegalRelease,
} from '../legal/legal-document.service';
import { ThemeService } from '../../core/ui/theme.service';

const release: LegalRelease = {
  version: 'test-v1',
  locale: 'en',
  terms_text: 'Test terms',
  privacy_text: 'Test privacy',
  published_at: '2026-09-29T00:00:00Z',
};

async function setup(document: LegalRelease | null) {
  const signUp = vi.fn(async () => ({
    error: new Error('Fixture stops before navigation'),
  }));

  await TestBed.configureTestingModule({
    imports: [AuthSignupComponent],
    providers: [
      provideRouter([]),
      {
        provide: SupabaseAuthService,
        useValue: { signUpWithPassword: signUp },
      },
      {
        provide: LegalDocumentService,
        useValue: { load: vi.fn(async () => document) },
      },
      {
        provide: ThemeService,
        useValue: { isDark: signal(false), toggleTheme: vi.fn() },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(AuthSignupComponent);
  await fixture.whenStable();
  fixture.detectChanges();
  fixture.componentInstance.form.patchValue({
    email: 'fixture@example.invalid',
    password: 'Password123!',
    confirm: 'Password123!',
  });

  return { fixture, signUp };
}

describe('Registration legal documents', () => {
  it('links exact versions and requires an unchecked terms checkbox', async () => {
    const { fixture, signUp } = await setup(release);
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('a[href="/legal/terms/test-v1"]')).not.toBeNull();
    expect(
      root.querySelector('a[href="/legal/privacy/test-v1"]')
    ).not.toBeNull();
    expect(fixture.componentInstance.form.controls.termsAccepted.value).toBe(
      false
    );
    await fixture.componentInstance.handleSubmit();
    expect(signUp).not.toHaveBeenCalled();
    fixture.componentInstance.form.controls.termsAccepted.setValue(true);
    await fixture.componentInstance.handleSubmit();
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({ legalVersion: 'test-v1', termsAccepted: true })
    );
  });
  it('blocks registration when no final documents are published', async () => {
    const { fixture, signUp } = await setup(null);
    fixture.componentInstance.form.controls.termsAccepted.setValue(true);
    await fixture.componentInstance.handleSubmit();
    expect(signUp).not.toHaveBeenCalled();
    expect(fixture.componentInstance.isDisabled).toBe(true);
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain(
      'Registration is temporarily unavailable'
    );
  });
});
