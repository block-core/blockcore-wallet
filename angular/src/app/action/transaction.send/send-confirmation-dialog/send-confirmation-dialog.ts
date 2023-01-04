import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface SendConfirmationDialogData {
  amount: number;
  symbol: string;
}

@Component({
  selector: 'send-confirmation-dialog',
  templateUrl: 'send-confirmation-dialog.html',
  styleUrls: ['send-confirmation-dialog.css'],
})
export class SendConfirmationDialog {
  constructor(public dialogRef: MatDialogRef<SendConfirmationDialogData>, @Inject(MAT_DIALOG_DATA) public data: SendConfirmationDialogData) {}

  onNoClick(): void {
    this.data.amount = undefined;
    this.dialogRef.close();
  }
}
