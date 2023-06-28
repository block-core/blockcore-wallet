import { Component, Inject } from '@angular/core';
import { MatLegacyDialog as MatDialog, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';

export interface PasswordDialogData {
  password: string;
}

@Component({
  selector: 'password-dialog',
  templateUrl: 'password-dialog.html',
})
export class PasswordDialog {
  constructor(public dialogRef: MatDialogRef<PasswordDialog>, @Inject(MAT_DIALOG_DATA) public data: PasswordDialogData) {}

  onNoClick(): void {
    this.data.password = null;
    this.dialogRef.close();
  }
}
