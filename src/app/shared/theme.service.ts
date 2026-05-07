import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const DARK_CLASS = 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _theme = signal<Theme>(this.readInitialTheme());

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    effect(() => {
      const current = this._theme();
      this.applyTheme(current);
      this.persistTheme(current);
    });
  }

  toggle(): void {
    this._theme.update(current => (current === 'dark' ? 'light' : 'dark'));
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }

  private readInitialTheme(): Theme {
    if (!this.isBrowser) {
      return 'light';
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return 'light';
  }

  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) {
      return;
    }
    const body = this.document.body;
    if (theme === 'dark') {
      body.classList.add(DARK_CLASS);
    } else {
      body.classList.remove(DARK_CLASS);
    }
  }

  private persistTheme(theme: Theme): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }
}
