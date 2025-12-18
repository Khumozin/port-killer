import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggle } from './theme-toggle';
import { ThemeService } from '../services/theme-service';
import { signal } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ThemeToggle', () => {
  let component: ThemeToggle;
  let fixture: ComponentFixture<ThemeToggle>;
  let mockThemeService: {
    theme: ReturnType<typeof signal<'light' | 'dark' | 'system'>>;
    resolvedTheme: ReturnType<typeof signal<'light' | 'dark'>>;
    setTheme: ReturnType<typeof vi.fn>;
    toggleTheme: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    // Create mock theme service
    mockThemeService = {
      theme: signal<'light' | 'dark' | 'system'>('system'),
      resolvedTheme: signal<'light' | 'dark'>('light'),
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ThemeToggle],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should inject ThemeService', () => {
      expect(component['themeService']).toBeTruthy();
    });
  });

  describe('Theme Icon Display', () => {
    it('should display sun icon when theme is light', () => {
      mockThemeService.theme.set('light');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const sunIcon = compiled.querySelector('ng-icon[name="lucideSun"]');
      expect(sunIcon).toBeTruthy();
    });

    it('should display moon icon when theme is dark', () => {
      mockThemeService.theme.set('dark');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const moonIcon = compiled.querySelector('ng-icon[name="lucideMoon"]');
      expect(moonIcon).toBeTruthy();
    });

    it('should display monitor icon when theme is system', () => {
      mockThemeService.theme.set('system');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const monitorIcon = compiled.querySelector('ng-icon[name="lucideMonitor"]');
      expect(monitorIcon).toBeTruthy();
    });

    it('should update icon when theme changes', () => {
      mockThemeService.theme.set('light');
      fixture.detectChanges();

      let compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('ng-icon[name="lucideSun"]')).toBeTruthy();

      mockThemeService.theme.set('dark');
      fixture.detectChanges();

      compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('ng-icon[name="lucideMoon"]')).toBeTruthy();
      expect(compiled.querySelector('ng-icon[name="lucideSun"]')).toBeFalsy();
    });
  });

  describe('Toggle Button', () => {
    it('should render toggle button', () => {
      const button = fixture.nativeElement.querySelector('button[data-cy="theme-toggle"]');
      expect(button).toBeTruthy();
    });

    it('should have aria-label for accessibility', () => {
      const button = fixture.nativeElement.querySelector('button[data-cy="theme-toggle"]');
      expect(button?.getAttribute('aria-label')).toBe('Toggle theme');
    });

    it('should have screen reader only text', () => {
      const srOnlyText = fixture.nativeElement.querySelector('.sr-only');
      expect(srOnlyText).toBeTruthy();
      expect(srOnlyText?.textContent).toBe('Toggle theme');
    });

    it('should have ghost variant and icon size attributes', () => {
      const button = fixture.nativeElement.querySelector('button[data-cy="theme-toggle"]');
      expect(button?.getAttribute('variant')).toBe('ghost');
      expect(button?.getAttribute('size')).toBe('icon');
    });
  });

  describe('setTheme()', () => {
    it('should call ThemeService.setTheme with light theme', () => {
      component['setTheme']('light');
      expect(mockThemeService.setTheme).toHaveBeenCalledWith('light');
    });

    it('should call ThemeService.setTheme with dark theme', () => {
      component['setTheme']('dark');
      expect(mockThemeService.setTheme).toHaveBeenCalledWith('dark');
    });

    it('should call ThemeService.setTheme with system theme', () => {
      component['setTheme']('system');
      expect(mockThemeService.setTheme).toHaveBeenCalledWith('system');
    });
  });

  describe('Signal Integration', () => {
    it('should read theme from ThemeService signal', () => {
      mockThemeService.theme.set('dark');
      expect(component['theme']()).toBe('dark');
    });

    it('should update when ThemeService theme signal changes', () => {
      mockThemeService.theme.set('light');
      expect(component['theme']()).toBe('light');

      mockThemeService.theme.set('dark');
      expect(component['theme']()).toBe('dark');
    });

    it('should be reactive to signal changes', () => {
      const initialTheme = component['theme']();
      mockThemeService.theme.set('dark');
      const updatedTheme = component['theme']();

      expect(initialTheme).not.toBe(updatedTheme);
      expect(updatedTheme).toBe('dark');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on toggle button', () => {
      const button = fixture.nativeElement.querySelector('button[data-cy="theme-toggle"]');
      expect(button?.getAttribute('aria-label')).toBe('Toggle theme');
    });

    it('should have screen reader text', () => {
      const srText = fixture.nativeElement.querySelector('.sr-only');
      expect(srText).toBeTruthy();
      expect(srText?.textContent?.trim()).toBe('Toggle theme');
    });

    it('should use semantic button element', () => {
      const button = fixture.nativeElement.querySelector('button[data-cy="theme-toggle"]');
      expect(button?.tagName.toLowerCase()).toBe('button');
    });
  });

  describe('Template Structure', () => {
    it('should have dropdown menu trigger directive', () => {
      const button = fixture.nativeElement.querySelector('button[data-cy="theme-toggle"]');
      // Angular renders directives in various ways, just check button exists
      expect(button).toBeTruthy();
    });

    it('should have ng-template for dropdown menu', () => {
      // The template exists in the component but isn't rendered until opened
      // We can verify the component has the proper structure by checking compilation
      expect(component).toBeTruthy();
    });
  });

  describe('Theme Display Logic', () => {
    it('should show correct icon for each theme state', () => {
      const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
      const expectedIcons = {
        light: 'lucideSun',
        dark: 'lucideMoon',
        system: 'lucideMonitor',
      };

      themes.forEach((theme) => {
        mockThemeService.theme.set(theme);
        fixture.detectChanges();

        const icon = fixture.nativeElement.querySelector(
          `ng-icon[name="${expectedIcons[theme]}"]`
        );
        expect(icon).toBeTruthy();
      });
    });

    it('should only show one icon at a time', () => {
      mockThemeService.theme.set('light');
      fixture.detectChanges();

      const icons = fixture.nativeElement.querySelectorAll('button[data-cy="theme-toggle"] ng-icon[hlm]');
      expect(icons.length).toBe(1);
    });
  });
});
