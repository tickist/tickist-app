import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { LegalDocumentComponent } from './legal-document.component';
import { LegalDocumentService, LegalRelease } from './legal-document.service';

const release: LegalRelease = {
  version: 'test-v1',
  locale: 'pl',
  terms_text: '# Warunki\n\nTreść regulaminu. <script>alert(1)</script>',
  privacy_text: '# Prywatność\n\nTreść polityki.',
  published_at: '2026-09-29T00:00:00Z',
};

async function setup(document: LegalRelease | null) {
  const params = new BehaviorSubject(
    convertToParamMap({ document: 'terms', version: 'test-v1' })
  );

  const load = vi.fn(async (_version?: string) => document);
  await TestBed.configureTestingModule({
    imports: [LegalDocumentComponent],
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: params } },
      { provide: LegalDocumentService, useValue: { load } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(LegalDocumentComponent);
  await fixture.whenStable();
  fixture.detectChanges();

  return { fixture, load, params };
}

describe('Public legal documents', () => {
  it('loads the exact version without login and sanitizes its Markdown', async () => {
    const { fixture, load, params } = await setup(release);
    const root: HTMLElement = fixture.nativeElement;
    expect(load).toHaveBeenCalledWith('test-v1');
    expect(root.querySelector('article')?.getAttribute('lang')).toBe('pl');
    expect(root.querySelector('article h1')?.textContent).toBe('Warunki');
    expect(root.querySelector('article script')).toBeNull();
    params.next(convertToParamMap({ document: 'privacy', version: 'test-v1' }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('article')?.textContent).toContain(
      'Treść polityki.'
    );
    expect(root.querySelector('article')?.textContent).not.toContain(
      'Treść regulaminu.'
    );
  });

  it('shows unavailable documents without rendering draft content', async () => {
    const { fixture } = await setup(null);
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('article')).toBeNull();
    expect(root.textContent).toContain('This document is not available yet.');
  });
});
