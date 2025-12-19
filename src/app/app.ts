import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'ngx-sonner';
import { filter, take } from 'rxjs';
import { Header } from './core/ui/header';
import { Confirm } from './ui/confirm';

interface ProcessInfo {
  pid: string;
  command: string;
  user: string;
}

@Component({
  selector: 'app-root',
  imports: [HlmInputImports, HlmButtonImports, HlmToasterImports, Header],

  template: ` <div
      class="pointer-events-none fixed top-0 left-0 z-40 h-[1380px] w-[560px] -translate-y-[350px] -rotate-45 bg-radial-(--spotlight-gradient)"
    ></div>
    <div class="p-4 max-w-xl mx-auto">
      <app-header />

      <input
        class="w-80"
        hlmInput
        type="number"
        placeholder="Enter port"
        (input)="port.set($any($event.target).value)"
      />

      <div class="flex mt-2 gap-2">
        <button hlmBtn (click)="scan()">Scan</button>

        <button hlmBtn variant="destructive" (click)="killAllDevPorts()">Kill all dev ports</button>
      </div>

      <div class="mt-4">
        <h2 class="font-semibold">Quick ports</h2>
        <div class="flex gap-2 mt-2">
          @for (p of commonPorts(); track $index) {
            <button hlmBtn variant="outline" (click)="scan(p)">
              {{ p }}
            </button>
          }
        </div>
      </div>

      @if (processes().length) {
        <pre class="mt-6 mb-2 p-4 bg-accent rounded border overflow-x-auto text-sm">{{
          processesJson()
        }}</pre>

        <button hlmBtn variant="destructive" (click)="killSelected()">Kill processes</button>
      }
    </div>

    <hlm-toaster />`,
  styles: [''],
})
export class App implements OnInit {
  private readonly _hlmDialogService = inject(HlmDialogService);

  port = signal<number | null>(null);
  processes = signal<ProcessInfo[]>([]);
  commonPorts = signal<number[]>([]);

  processesJson = computed(() => JSON.stringify(this.processes(), null, 2));

  async ngOnInit() {
    this.commonPorts.set(await invoke<number[]>('scan_common_ports'));
  }

  async scan(port?: number) {
    const _port = port ?? this.port();
    if (!_port) return;

    this.port.set(+_port);
    this.processes.set(await invoke<ProcessInfo[]>('list_processes', { port: this.port() }));

    if (this.processes().length === 0) {
      toast(`${this.processes().length} processes found`);
    }
  }

  async killSelected() {
    const dialogRef: BrnDialogRef<boolean> = this._hlmDialogService.open(Confirm, {
      context: {
        port: this.port(),
      },
      contentClass: 'w-96',
    });

    dialogRef.closed$.pipe(filter(Boolean), take(1)).subscribe(async () => {
      const pids = this.processes().map((p) => p.pid);
      const message = await invoke<string>('kill_pids', { pids });
      this.processes.set([]);
      toast(message);
    });
  }

  async killAllDevPorts() {
    const dialogRef: BrnDialogRef<boolean> = this._hlmDialogService.open(Confirm, {
      context: {
        port: this.port(),
      },
      contentClass: 'w-96',
    });

    dialogRef.closed$.pipe(filter(Boolean), take(1)).subscribe(async () => {
      for (const port of this.commonPorts()) {
        const processes = await invoke<ProcessInfo[]>('list_processes', { port });
        if (processes.length) {
          await invoke('kill_pids', {
            pids: processes.map((p) => p.pid),
          });
        }
      }

      toast('All dev ports cleared');
    });
  }
}
