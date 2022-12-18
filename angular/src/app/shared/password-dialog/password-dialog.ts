import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

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
