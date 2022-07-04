import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate } from '@angular/service-worker';
@Injectable({
  providedIn: 'root'
})
export class AppUpdateService {
  constructor(private readonly updates: SwUpdate, private snackBar: MatSnackBar) {
    this.updates.available.subscribe(event => {
      this.showAppUpdateAlert();
    });
  }
  showAppUpdateAlert() {
    let sb = this.snackBar.open('App Update available!', 'Update', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
    sb.onAction().subscribe(() => {
      this.doAppUpdate();
    });
  }
  doAppUpdate() {
    this.updates.activateUpdate().then(() => document.location.reload());
  }
}
