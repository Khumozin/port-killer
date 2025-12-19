import { Component, inject } from '@angular/core';
import { BrnAlertDialogImports } from '@spartan-ng/brain/alert-dialog';
import { BrnDialogClose, BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-confirm',
  imports: [BrnAlertDialogImports, HlmAlertDialogImports, HlmButtonImports, BrnDialogClose],
  templateUrl: './confirm.html',
  styleUrl: './confirm.css',
})
export class Confirm {
  private readonly _dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);

  continue(): void {
    this._dialogRef.close(true);
  }
}
