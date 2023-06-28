import { ApplicationRef, Injectable } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, interval, map } from 'rxjs';
import { RuntimeService } from "../../shared/runtime.service";
@Injectable({
  providedIn: 'root'
})
export class AppUpdateService {
  constructor(private readonly update: SwUpdate, private snackBar: MatSnackBar, private runtime: RuntimeService) {
    if (!this.runtime.isExtension) {
      this.updateClient();
    }
  }

  updateClient() {
    this.update.available.subscribe((event) => {
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
    this.update.activateUpdate().then(() => document.location.reload());
  }
}
