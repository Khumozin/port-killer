import { isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Current theme selection (light, dark, or system)
  readonly theme = signal<Theme>(this.getStoredTheme());

  // Actual applied theme (resolved from system if needed)
  readonly resolvedTheme = signal<'light' | 'dark'>('light');

  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    if (this.isBrowser) {
      this.initializeTheme();
      this.setupMediaQueryListener();
    }

    // Update DOM whenever resolved theme changes
    effect(() => {
      if (this.isBrowser) {
        this.applyTheme(this.resolvedTheme());
      }
    });
  }

  /**
   * Set the theme preference
   */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
    if (this.isBrowser) {
      localStorage.setItem('theme', theme);
      this.updateResolvedTheme();
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const currentResolved = this.resolvedTheme();
    const newTheme = currentResolved === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Get stored theme from localStorage or default to system
   */
  private getStoredTheme(): Theme {
    if (!this.isBrowser) {
      return 'system';
    }

    const stored = localStorage.getItem('theme') as Theme | null;
    return stored || 'system';
  }

  /**
   * Initialize theme on service creation
   */
  private initializeTheme(): void {
    this.updateResolvedTheme();
  }

  /**
   * Update the resolved theme based on current selection
   */
  private updateResolvedTheme(): void {
    const themeValue = this.theme();

    if (themeValue === 'system') {
      this.resolvedTheme.set(this.getSystemTheme());
    } else {
      this.resolvedTheme.set(themeValue);
    }
  }

  /**
   * Get system theme preference
   */
  private getSystemTheme(): 'light' | 'dark' {
    if (!this.isBrowser) {
      return 'light';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  /**
   * Listen for system theme changes
   */
  private setupMediaQueryListener(): void {
    if (!this.isBrowser) {
      return;
    }

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', (e) => {
      if (this.theme() === 'system') {
        this.resolvedTheme.set(e.matches ? 'dark' : 'light');
      }
    });
  }
}
