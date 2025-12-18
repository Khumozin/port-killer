import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideMonitor, lucideMoon, lucideSun } from '@ng-icons/lucide';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';

import { Theme, ThemeService } from '../services/theme-service';

@Component({
  selector: 'app-theme-toggle',
  imports: [NgIcon, HlmIcon, HlmDropdownMenuImports, HlmButtonImports],
  providers: [provideIcons({ lucideSun, lucideMoon, lucideMonitor, lucideCheck })],
  template: `
    <button
      hlmBtn
      variant="ghost"
      size="icon"
      [hlmDropdownMenuTrigger]="themeMenu"
      data-cy="theme-toggle"
      aria-label="Toggle theme"
    >
      @if (theme() === 'light') {
        <ng-icon hlm name="lucideSun" size="sm" />
      } @else if (theme() === 'dark') {
        <ng-icon hlm name="lucideMoon" size="sm" />
      } @else {
        <ng-icon hlm name="lucideMonitor" size="sm" />
      }
      <span class="sr-only">Toggle theme</span>
    </button>

    <ng-template #themeMenu>
      <hlm-dropdown-menu class="w-40">
        <hlm-dropdown-menu-group>
          <button hlmDropdownMenuItem (click)="setTheme('light')">
            <ng-icon hlm name="lucideSun" size="sm" />
            <span>Light</span>
            @if (theme() === 'light') {
              <ng-icon hlm name="lucideCheck" size="sm" class="ml-auto" />
            }
          </button>
          <button hlmDropdownMenuItem (click)="setTheme('dark')">
            <ng-icon hlm name="lucideMoon" size="sm" />
            <span>Dark</span>
            @if (theme() === 'dark') {
              <ng-icon hlm name="lucideCheck" size="sm" class="ml-auto" />
            }
          </button>
          <button hlmDropdownMenuItem (click)="setTheme('system')">
            <ng-icon hlm name="lucideMonitor" size="sm" />
            <span>System</span>
            @if (theme() === 'system') {
              <ng-icon hlm name="lucideCheck" size="sm" class="ml-auto" />
            }
          </button>
        </hlm-dropdown-menu-group>
      </hlm-dropdown-menu>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  private readonly themeService = inject(ThemeService);

  protected readonly theme = this.themeService.theme;

  protected setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }
}
