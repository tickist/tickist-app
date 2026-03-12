import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';

export type ThemeName = 'tickist' | 'tickist-light';

export const THEME_STORAGE_KEY = 'tickist.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly themeSignal = signal<ThemeName>(this.resolveInitialTheme());

  readonly theme = this.themeSignal.asReadonly();
  readonly isDark = computed(() => this.themeSignal() === 'tickist');

  constructor() {
    this.applyTheme(this.themeSignal(), false);
  }

  toggleTheme(): void {
    this.setTheme(this.isDark() ? 'tickist-light' : 'tickist');
  }

  setTheme(theme: ThemeName, persist = true): void {
    this.applyTheme(theme, persist);
    this.themeSignal.set(theme);
  }

  private resolveInitialTheme(): ThemeName {
    const currentTheme =
      this.document.documentElement.getAttribute('data-theme');
    if (isThemeName(currentTheme)) {
      return currentTheme;
    }

    if (!isPlatformBrowser(this.platformId)) {
      return 'tickist';
    }

    const storedTheme = this.safeGetStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }

    const prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    return prefersDark ? 'tickist' : 'tickist-light';
  }

  private applyTheme(theme: ThemeName, persist: boolean): void {
    const colorScheme = theme === 'tickist' ? 'dark' : 'light';
    const root = this.document.documentElement;

    root.setAttribute('data-theme', theme);
    root.style.colorScheme = colorScheme;

    this.document.body?.setAttribute('data-theme', theme);
    if (this.document.body) {
      this.document.body.style.colorScheme = colorScheme;
    }

    if (persist && isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Ignore storage errors in private mode / blocked storage.
      }
    }
  }

  private safeGetStoredTheme(): ThemeName | null {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      return isThemeName(storedTheme) ? storedTheme : null;
    } catch {
      return null;
    }
  }
}

function isThemeName(value: string | null): value is ThemeName {
  return value === 'tickist' || value === 'tickist-light';
}
