import { ChangeDetectionStrategy, Component, input } from '@angular/core';

interface ParentProcess {
  pid: string;
  ppid: string;
  command: string;
  user: string;
  fullCommand: string;
}

interface ProcessInfo {
  pid: string;
  command: string;
  user: string;
  fullCommand: string;
  parentChain: ParentProcess[];
}

@Component({
  selector: 'app-process-detail',
  template: `
    <div class="p-4 bg-accent rounded border mb-4">
      <div class="mb-3">
        <h3 class="font-semibold text-lg mb-2">Process on Port {{ port() }}</h3>
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt class="font-medium">PID:</dt>
          <dd class="font-mono">{{ process().pid }}</dd>

          <dt class="font-medium">Command:</dt>
          <dd class="font-mono break-all">{{ process().command }}</dd>

          <dt class="font-medium">User:</dt>
          <dd>{{ process().user }}</dd>

          <dt class="font-medium">Full Command:</dt>
          <dd class="font-mono text-xs break-all">{{ process().fullCommand }}</dd>
        </dl>
      </div>

      @if (process().parentChain.length > 0) {
        <div class="mt-4 pt-4 border-t border-border">
          <h4 class="font-medium text-sm mb-3">Parent Process Chain</h4>
          <ol class="space-y-2" aria-label="Parent process hierarchy">
            @for (parent of process().parentChain; track parent.pid; let idx = $index) {
              <li class="flex items-start gap-2 text-sm">
                <span class="text-muted-foreground min-w-4">{{ idx + 1 }}.</span>
                <div class="flex-1">
                  <div class="flex gap-2 items-baseline flex-wrap">
                    <span class="font-mono text-xs">PID {{ parent.pid }}</span>
                    <span class="text-muted-foreground">→</span>
                    <span class="font-medium">{{ parent.command }}</span>
                    <span class="text-muted-foreground text-xs">({{ parent.user }})</span>
                  </div>
                  @if (parent.fullCommand !== parent.command) {
                    <div class="font-mono text-xs text-muted-foreground mt-1 break-all">
                      {{ parent.fullCommand }}
                    </div>
                  }
                </div>
              </li>
            }
          </ol>
        </div>
      }
    </div>
  `,
  styles: [''],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessDetail {
  process = input.required<ProcessInfo>();
  port = input.required<number>();
}
