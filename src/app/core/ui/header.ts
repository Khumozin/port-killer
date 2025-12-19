import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideCircleOff } from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { hlmCode } from '@spartan-ng/helm/typography';
import { VersionService } from '../services/version.service';
import { ThemeToggle } from './theme-toggle';

@Component({
  selector: 'app-header',
  imports: [ThemeToggle, HlmIconImports],
  providers: [provideIcons({ lucideCircleOff })],
  template: `
    <span class="flex gap-2">
      <h1 class="text-2xl font-bold mb-4">Port Killer</h1>
      <ng-icon hlm name="lucideCircleOff" size="lg" />
    </span>

    <div class="flex items-center gap-1">
      <code class="${hlmCode}">v{{ _versionService.version() }}</code>
      <app-theme-toggle />
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex justify-between',
  },
})
export class Header {
  protected readonly _versionService = inject(VersionService);
}
