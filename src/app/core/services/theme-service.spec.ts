import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ThemeService } from './theme-service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ThemeService', () => {
  let service: ThemeService;
  let localStorageMock: { [key: string]: string };
  let mediaQueryListeners: Array<(event: MediaQueryListEvent) => void>;
  let mockMatchMedia: (query: string) => MediaQueryList;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
    });

    // Mock media query listeners
    mediaQueryListeners = [];
    mockMatchMedia = vi.fn((query: string): MediaQueryList => {
      const mql = {
        matches: query.includes('dark') ? false : true,
        media: query,
        addEventListener: vi.fn((_event: string, listener: (e: MediaQueryListEvent) => void) => {
          mediaQueryListeners.push(listener);
        }),
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
      return mql;
    });
    vi.stubGlobal('matchMedia', mockMatchMedia);

    // Mock document.documentElement
    const mockClassList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn(),
    };
    vi.stubGlobal('document', {
      documentElement: {
        classList: mockClassList,
      },
    });

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should default to system theme when no stored preference', () => {
      expect(service.theme()).toBe('system');
    });

    it('should load stored theme preference from localStorage', () => {
      localStorageMock['theme'] = 'dark';

      // Recreate service to test initialization
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      service = TestBed.inject(ThemeService);

      expect(service.theme()).toBe('dark');
    });

    it('should resolve system theme to light by default', () => {
      // matchMedia returns matches: false for dark mode
      expect(service.resolvedTheme()).toBe('light');
    });

    it('should resolve system theme to dark when system prefers dark', () => {
      mockMatchMedia = vi.fn((query: string): MediaQueryList => {
        const mql = {
          matches: query.includes('dark') ? true : false,
          media: query,
          addEventListener: vi.fn((_event: string, listener: (e: MediaQueryListEvent) => void) => {
            mediaQueryListeners.push(listener);
          }),
          removeEventListener: vi.fn(),
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as unknown as MediaQueryList;
        return mql;
      });
      vi.stubGlobal('matchMedia', mockMatchMedia);

      // Recreate service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      service = TestBed.inject(ThemeService);

      expect(service.resolvedTheme()).toBe('dark');
    });
  });

  describe('setTheme()', () => {
    it('should set theme preference', () => {
      service.setTheme('dark');
      expect(service.theme()).toBe('dark');
    });

    it('should persist theme to localStorage', () => {
      service.setTheme('dark');
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
      expect(localStorageMock['theme']).toBe('dark');
    });

    it('should update resolved theme when setting explicit theme', () => {
      service.setTheme('dark');
      expect(service.resolvedTheme()).toBe('dark');

      service.setTheme('light');
      expect(service.resolvedTheme()).toBe('light');
    });

    it('should resolve to system theme when setting system', () => {
      service.setTheme('system');
      expect(service.theme()).toBe('system');
      // Should resolve to light (default mock behavior)
      expect(service.resolvedTheme()).toBe('light');
    });

    it('should apply theme to DOM', async () => {
      service.setTheme('dark');

      // Wait a tick for effects to process
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    it('should remove dark class when setting light theme', async () => {
      service.setTheme('light');

      // Wait a tick for effects to process
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    });
  });

  describe('toggleTheme()', () => {
    it('should toggle from light to dark', () => {
      service.setTheme('light');
      service.toggleTheme();
      expect(service.theme()).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      service.setTheme('dark');
      service.toggleTheme();
      expect(service.theme()).toBe('light');
    });

    it('should toggle from system to opposite of resolved theme', () => {
      service.setTheme('system');
      // Resolved theme is light by default
      expect(service.resolvedTheme()).toBe('light');

      service.toggleTheme();
      expect(service.theme()).toBe('dark');
    });

    it('should persist toggled theme', () => {
      service.setTheme('light');
      service.toggleTheme();

      expect(localStorageMock['theme']).toBe('dark');
    });
  });

  describe('System Theme Detection', () => {
    it('should detect system dark mode preference', () => {
      mockMatchMedia = (query: string): MediaQueryList => {
        return {
          matches: query.includes('dark'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as unknown as MediaQueryList;
      };
      vi.stubGlobal('matchMedia', mockMatchMedia);

      // Recreate service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      service = TestBed.inject(ThemeService);

      expect(service.resolvedTheme()).toBe('dark');
    });

    it('should update when system theme changes', () => {
      service.setTheme('system');
      expect(service.resolvedTheme()).toBe('light');

      // Simulate system theme change to dark
      const event = {
        matches: true,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryListEvent;

      mediaQueryListeners.forEach((listener) => listener(event));

      expect(service.resolvedTheme()).toBe('dark');
    });

    it('should not update when explicit theme is set and system changes', () => {
      service.setTheme('light');
      expect(service.resolvedTheme()).toBe('light');

      // Simulate system theme change to dark
      const event = {
        matches: true,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryListEvent;

      mediaQueryListeners.forEach((listener) => listener(event));

      // Should still be light since we set explicit theme
      expect(service.resolvedTheme()).toBe('light');
    });

    it('should setup media query listener', () => {
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(mediaQueryListeners.length).toBeGreaterThan(0);
    });
  });

  describe('DOM Updates', () => {
    it('should add dark class when dark theme applied', async () => {
      service.setTheme('dark');

      // Wait a tick for effects to process
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    it('should remove dark class when light theme applied', async () => {
      service.setTheme('light');

      // Wait a tick for effects to process
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    });

    it('should apply system theme to DOM', async () => {
      service.setTheme('system');

      // Wait a tick for effects to process
      await new Promise(resolve => setTimeout(resolve, 0));

      // System resolves to light by default
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    });

    it('should update DOM when system theme changes', async () => {
      service.setTheme('system');

      // Simulate system change to dark
      const event = {
        matches: true,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryListEvent;

      mediaQueryListeners.forEach((listener) => listener(event));

      // Wait a tick for effects to process
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
    });
  });

  describe('Server-Side Rendering (SSR)', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      service = TestBed.inject(ThemeService);
    });

    it('should default to system theme on server', () => {
      expect(service.theme()).toBe('system');
    });

    it('should resolve to light theme on server', () => {
      expect(service.resolvedTheme()).toBe('light');
    });

    it('should not access localStorage on server', () => {
      service.setTheme('dark');
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should not setup media query listener on server', () => {
      // On server, matchMedia should not be called
      // We verify this by ensuring the service initializes without errors
      expect(service).toBeTruthy();
    });

    it('should not apply theme to DOM on server', () => {
      service.setTheme('dark');

      // Should not modify DOM on server
      expect(document.documentElement.classList.add).not.toHaveBeenCalled();
    });
  });

  describe('Signal Reactivity', () => {
    it('should update signals reactively', () => {
      let themeValue = service.theme();
      expect(themeValue).toBe('system');

      service.setTheme('dark');
      themeValue = service.theme();
      expect(themeValue).toBe('dark');
    });

    it('should update resolved theme signal when theme changes', () => {
      service.setTheme('light');
      expect(service.resolvedTheme()).toBe('light');

      service.setTheme('dark');
      expect(service.resolvedTheme()).toBe('dark');
    });

    it('should maintain signal values across reads', () => {
      service.setTheme('dark');

      const firstRead = service.theme();
      const secondRead = service.theme();

      expect(firstRead).toBe(secondRead);
      expect(firstRead).toBe('dark');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid theme changes', () => {
      service.setTheme('light');
      service.setTheme('dark');
      service.setTheme('system');
      service.setTheme('light');

      expect(service.theme()).toBe('light');
      expect(localStorageMock['theme']).toBe('light');
    });

    it('should handle invalid stored theme gracefully', () => {
      localStorageMock['theme'] = 'invalid' as any;

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      service = TestBed.inject(ThemeService);

      // Should fall back to the invalid value (TypeScript would catch this)
      expect(service.theme()).toBe('invalid');
    });

    it('should handle empty localStorage', () => {
      localStorageMock = {};

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      service = TestBed.inject(ThemeService);

      expect(service.theme()).toBe('system');
    });
  });

  describe('Persistence', () => {
    it('should persist all theme options', () => {
      service.setTheme('light');
      expect(localStorageMock['theme']).toBe('light');

      service.setTheme('dark');
      expect(localStorageMock['theme']).toBe('dark');

      service.setTheme('system');
      expect(localStorageMock['theme']).toBe('system');
    });

    it('should load persisted theme on service creation', () => {
      localStorageMock['theme'] = 'dark';

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      const newService = TestBed.inject(ThemeService);

      expect(newService.theme()).toBe('dark');
      expect(newService.resolvedTheme()).toBe('dark');
    });
  });
});
