import { Component, inject } from '@angular/core';
import { BrnAlertDialogImports } from '@spartan-ng/brain/alert-dialog';
import { BrnDialogClose, BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-confirm',
  imports: [BrnAlertDialogImports, HlmAlertDialogImports, HlmButtonImports, BrnDialogClose],
  template: `
    <hlm-alert-dialog-header>
      <h2 hlmAlertDialogTitle>Are you absolutely sure?</h2>
      <p hlmAlertDialogDescription>Kill selected processes?</p>
    </hlm-alert-dialog-header>
    <hlm-alert-dialog-footer class="mt-4">
      <button hlmAlertDialogCancel brnDialogClose>Cancel</button>
      <button hlmAlertDialogAction (click)="continue()">Continue</button>
    </hlm-alert-dialog-footer>
  `,
  styles: [''],
})
export class Confirm {
  private readonly _dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);

  continue(): void {
    this._dialogRef.close(true);
  }
}
