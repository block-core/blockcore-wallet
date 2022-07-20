import { ApplicationRef, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, interval, map } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AppUpdateService {
  constructor(private readonly update: SwUpdate, private snackBar: MatSnackBar, private appRef: ApplicationRef) {
    this.updateClient();
    this.checkUpdate();
  }

  updateClient() {
    if (!this.update.isEnabled) {
      console.log('Not Enabled');
      return;
    }

    if (this.update.isEnabled) {
      this.update.versionUpdates.pipe(
        filter((evt: any): evt is VersionReadyEvent => evt.type === 'VERSION_READY' || evt.type ==='UPDATE_AVAILABLE'),
        map((evt: any) => {
          console.info(`currentVersion=[${evt.currentVersion} | latestVersion=[${evt.latestVersion}]`);
          this.showAppUpdateAlert();
        }),
      );
    }
  }

  checkUpdate() {
    this.appRef.isStable.subscribe((isStable) => {
      if (isStable) {
        const timeInterval = interval(8 * 60 * 60 * 1000);

        timeInterval.subscribe(() => {
          this.update.checkForUpdate().then(() => console.log('checked'));
          console.log('update checked');
        });
      }
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
