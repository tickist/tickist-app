import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService, THEME_STORAGE_KEY } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
    document.body.removeAttribute('data-theme');
    document.body.style.colorScheme = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes from localStorage theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'tickist-light');
    mockMatchMedia(false);

    const service = TestBed.runInInjectionContext(() => new ThemeService());

    expect(service.theme()).toBe('tickist-light');
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe(
      'tickist-light'
    );
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('falls back to system preference when storage is empty', () => {
    mockMatchMedia(true);

    const service = TestBed.runInInjectionContext(() => new ThemeService());

    expect(service.theme()).toBe('tickist');
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('tickist');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('toggleTheme updates DOM and persists user choice', () => {
    mockMatchMedia(true);
    const service = TestBed.runInInjectionContext(() => new ThemeService());

    service.toggleTheme();

    expect(service.theme()).toBe('tickist-light');
    expect(document.documentElement.getAttribute('data-theme')).toBe(
      'tickist-light'
    );
    expect(document.body.getAttribute('data-theme')).toBe('tickist-light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('tickist-light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
});

function mockMatchMedia(matches: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation(() => ({
      matches,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}
