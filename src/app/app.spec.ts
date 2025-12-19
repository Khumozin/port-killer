import { TestBed, ComponentFixture } from '@angular/core/testing';
import { App } from './app';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { Subject } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Tauri API
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

// Mock ngx-sonner
const mockToast = vi.fn();
vi.mock('ngx-sonner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ngx-sonner')>();
  return {
    ...actual,
    toast: (...args: unknown[]) => mockToast(...args),
  };
});

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let mockDialogService: {
    open: ReturnType<typeof vi.fn>;
  };
  let mockDialogRef: {
    closed$: Subject<boolean>;
  };

  beforeEach(async () => {
    // Setup mocks for ThemeService (used by ThemeToggle component)
    const localStorageMock = {} as Record<string, string>;
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete localStorageMock[key];
        }),
        clear: vi.fn(() =>
          Object.keys(localStorageMock).forEach((key) => delete localStorageMock[key]),
        ),
        key: vi.fn(),
        length: 0,
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'matchMedia', {
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      writable: true,
      configurable: true,
    });

    // Setup mock dialog service
    mockDialogRef = {
      closed$: new Subject<boolean>(),
    };

    mockDialogService = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: HlmDialogService, useValue: mockDialogService }],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create the app', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty port and processes', () => {
      expect(component.port()).toBeNull();
      expect(component.processes()).toEqual([]);
      expect(component.commonPorts()).toEqual([]);
    });

    it('should render title', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Port Killer');
    });
  });

  describe('ngOnInit', () => {
    it('should load common ports on initialization', async () => {
      const mockPorts = [3000, 4200, 5173, 8080];
      mockInvoke.mockResolvedValue(mockPorts);

      await component.ngOnInit();

      expect(mockInvoke).toHaveBeenCalledWith('scan_common_ports');
      expect(component.commonPorts()).toEqual(mockPorts);
    });

    it('should handle empty common ports', async () => {
      mockInvoke.mockResolvedValue([]);

      await component.ngOnInit();

      expect(component.commonPorts()).toEqual([]);
    });
  });

  describe('scan()', () => {
    it('should scan port from signal when no parameter provided', async () => {
      const mockProcesses = [
        { pid: '1234', command: 'node', user: 'test' },
        { pid: '5678', command: 'npm', user: 'test' },
      ];
      component.port.set(3000);
      mockInvoke.mockResolvedValue(mockProcesses);

      await component.scan();

      expect(mockInvoke).toHaveBeenCalledWith('list_processes', { port: 3000 });
      expect(component.processes()).toEqual(mockProcesses);
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should scan specific port when parameter provided', async () => {
      const mockProcesses = [{ pid: '9999', command: 'python', user: 'admin' }];
      mockInvoke.mockResolvedValue(mockProcesses);

      await component.scan(8080);

      expect(mockInvoke).toHaveBeenCalledWith('list_processes', { port: 8080 });
      expect(component.port()).toBe(8080);
      expect(component.processes()).toEqual(mockProcesses);
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should return early if port is null', async () => {
      component.port.set(null);

      await component.scan();

      expect(mockInvoke).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should handle no processes found', async () => {
      component.port.set(9999);
      mockInvoke.mockResolvedValue([]);

      await component.scan();

      expect(component.processes()).toEqual([]);
      expect(mockToast).toHaveBeenCalledWith('0 processes found');
    });

    it('should convert port to number', async () => {
      mockInvoke.mockResolvedValue([]);
      component.port.set('4200' as unknown as number);

      await component.scan();

      expect(mockInvoke).toHaveBeenCalledWith('list_processes', { port: 4200 });
    });
  });

  describe('killSelected()', () => {
    it('should open confirmation dialog with correct context', async () => {
      component.port.set(3000);
      component.processes.set([{ pid: '1234', command: 'node', user: 'test' }]);

      await component.killSelected();

      expect(mockDialogService.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          context: { port: 3000 },
          contentClass: 'w-96',
        }),
      );
    });

    it('should kill processes when dialog confirms', async () => {
      const mockProcesses = [
        { pid: '1234', command: 'node', user: 'test' },
        { pid: '5678', command: 'npm', user: 'test' },
      ];
      component.processes.set(mockProcesses);
      mockInvoke.mockResolvedValue('Processes killed successfully');

      await component.killSelected();
      mockDialogRef.closed$.next(true);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockInvoke).toHaveBeenCalledWith('kill_pids', {
        pids: ['1234', '5678'],
      });
      expect(component.processes()).toEqual([]);
      expect(mockToast).toHaveBeenCalledWith('Processes killed successfully');
    });

    it('should not kill processes when dialog is cancelled', async () => {
      const mockProcesses = [{ pid: '1234', command: 'node', user: 'test' }];
      component.processes.set(mockProcesses);

      await component.killSelected();
      mockDialogRef.closed$.next(false);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockInvoke).not.toHaveBeenCalledWith('kill_pids', expect.anything());
      expect(component.processes()).toEqual(mockProcesses);
    });
  });

  describe('killAllDevPorts()', () => {
    it('should open confirmation dialog', async () => {
      component.port.set(3000);

      await component.killAllDevPorts();

      expect(mockDialogService.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          context: { port: 3000 },
          contentClass: 'w-96',
        }),
      );
    });

    it('should kill processes on all common ports when confirmed', async () => {
      component.commonPorts.set([3000, 4200, 8080]);

      // Mock responses for each port
      mockInvoke
        .mockResolvedValueOnce([{ pid: '1111', command: 'node', user: 'test' }]) // 3000
        .mockResolvedValueOnce(undefined) // kill for 3000
        .mockResolvedValueOnce([]) // 4200 (no processes)
        .mockResolvedValueOnce([
          { pid: '2222', command: 'python', user: 'test' },
          { pid: '3333', command: 'flask', user: 'test' },
        ]) // 8080
        .mockResolvedValueOnce(undefined); // kill for 8080

      await component.killAllDevPorts();
      mockDialogRef.closed$.next(true);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockInvoke).toHaveBeenCalledWith('list_processes', { port: 3000 });
      expect(mockInvoke).toHaveBeenCalledWith('list_processes', { port: 4200 });
      expect(mockInvoke).toHaveBeenCalledWith('list_processes', { port: 8080 });
      expect(mockInvoke).toHaveBeenCalledWith('kill_pids', { pids: ['1111'] });
      expect(mockInvoke).toHaveBeenCalledWith('kill_pids', { pids: ['2222', '3333'] });
      expect(mockToast).toHaveBeenCalledWith('All dev ports cleared');
    });

    it('should not kill when dialog is cancelled', async () => {
      component.commonPorts.set([3000, 4200]);

      await component.killAllDevPorts();
      mockDialogRef.closed$.next(false);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockInvoke).not.toHaveBeenCalledWith('list_processes', expect.anything());
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should skip ports with no processes', async () => {
      component.commonPorts.set([3000, 4200]);

      mockInvoke
        .mockResolvedValueOnce([]) // 3000 - no processes
        .mockResolvedValueOnce([{ pid: '1234', command: 'node', user: 'test' }]) // 4200
        .mockResolvedValueOnce(undefined); // kill for 4200

      await component.killAllDevPorts();
      mockDialogRef.closed$.next(true);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify kill_pids was called only for port 4200 with processes
      expect(mockInvoke).toHaveBeenCalledWith('kill_pids', { pids: ['1234'] });

      // Verify list_processes was called for both ports
      expect(mockInvoke).toHaveBeenCalledWith('list_processes', { port: 3000 });
      expect(mockInvoke).toHaveBeenCalledWith('list_processes', { port: 4200 });
    });
  });

  describe('Computed Values', () => {
    it('should compute processesJson as formatted JSON', () => {
      const mockProcesses = [
        { pid: '1234', command: 'node', user: 'test' },
        { pid: '5678', command: 'npm', user: 'admin' },
      ];
      component.processes.set(mockProcesses);

      const expectedJson = JSON.stringify(mockProcesses, null, 2);
      expect(component.processesJson()).toBe(expectedJson);
    });

    it('should update processesJson when processes change', () => {
      component.processes.set([]);
      expect(component.processesJson()).toBe('[]');

      component.processes.set([{ pid: '1234', command: 'node', user: 'test' }]);
      expect(component.processesJson()).toContain('"pid": "1234"');
      expect(component.processesJson()).toContain('"command": "node"');
    });
  });

  describe('Template Integration', () => {
    it('should display port input field', () => {
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input[type="number"]');
      expect(input).toBeTruthy();
      expect(input?.getAttribute('placeholder')).toBe('Enter port');
    });

    it('should display scan button', () => {
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const scanButton = Array.from(buttons).find(
        (btn) => (btn as HTMLButtonElement).textContent?.trim() === 'Scan',
      );
      expect(scanButton).toBeTruthy();
    });

    it('should display kill all dev ports button', () => {
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const killAllButton = Array.from(buttons).find((btn) =>
        (btn as HTMLButtonElement).textContent?.includes('Kill all dev ports'),
      );
      expect(killAllButton).toBeTruthy();
    });

    it('should display quick port buttons when common ports loaded', async () => {
      component.commonPorts.set([3000, 4200, 5173]);
      fixture.detectChanges();

      const quickPortsSection = fixture.nativeElement.querySelector('h2.font-semibold');
      expect(quickPortsSection?.textContent).toBe('Quick ports');

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const portButtons = Array.from(buttons).filter((btn) =>
        ['3000', '4200', '5173'].includes((btn as HTMLButtonElement).textContent?.trim() || ''),
      );
      expect(portButtons.length).toBe(3);
    });

    it('should display processes when available', () => {
      component.processes.set([{ pid: '1234', command: 'node', user: 'test' }]);
      fixture.detectChanges();

      const pre = fixture.nativeElement.querySelector('pre');
      expect(pre).toBeTruthy();
      expect(pre?.textContent).toContain('"pid": "1234"');
      expect(pre?.textContent).toContain('"command": "node"');
    });

    it('should not display processes section when no processes', () => {
      component.processes.set([]);
      fixture.detectChanges();

      const pre = fixture.nativeElement.querySelector('pre');
      expect(pre).toBeFalsy();
    });

    it('should display kill processes button when processes exist', () => {
      component.processes.set([{ pid: '1234', command: 'node', user: 'test' }]);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const killButton = Array.from(buttons).find((btn) =>
        (btn as HTMLButtonElement).textContent?.includes('Kill processes'),
      );
      expect(killButton).toBeTruthy();
    });
  });
});
