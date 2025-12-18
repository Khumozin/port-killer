import { Component, signal, computed, inject } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { filter, take } from 'rxjs';
import { toast } from 'ngx-sonner';
import { Confirm } from './ui/confirm/confirm';

interface ProcessInfo {
  pid: string;
  command: string;
  user: string;
}

@Component({
  selector: 'app-root',
  imports: [HlmInputImports, HlmButtonImports, HlmToasterImports],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly _hlmDialogService = inject(HlmDialogService);
  port = signal<number | null>(null);
  processes = signal<ProcessInfo[]>([]);
  commonPorts = signal<number[]>([]);

  processesJson = computed(() => JSON.stringify(this.processes(), null, 2));

  async ngOnInit() {
    this.commonPorts.set(await invoke<number[]>('scan_common_ports'));
  }

  async scan(port?: number) {
    const p = port ?? this.port();
    if (!p) return;

    this.port.set(+p);
    this.processes.set(await invoke<ProcessInfo[]>('list_processes', { port: +p }));

    toast(`${this.processes().length} processes found`)
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
