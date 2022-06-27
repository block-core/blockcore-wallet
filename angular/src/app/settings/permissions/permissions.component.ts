import { Location } from '@angular/common';
import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Permission } from 'src/shared';
import { PermissionStore } from 'src/shared/store/permission-store';
import { UIState, FeatureService, NetworkStatusService } from '../../services';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PermissionsComponent implements OnDestroy {
  permissions: Permission[];

  constructor(public uiState: UIState, public location: Location, public networkStatus: NetworkStatusService, public feature: FeatureService, private permissionStore: PermissionStore) {
    this.uiState.title = 'Permissions';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;

    this.permissions = this.permissionStore.all();

    if (this.permissions.length == 0) {
      this.permissions = [
        {
          domain: 'epmiiicbebgckgoggnflbpcglnabbage',
          created: new Date().toISOString(),
          condition: 'forever',
          level: 1,
        },
        {
          domain: 'http://localhost:3000',
          created: new Date().toISOString(),
          condition: 'expires',
          level: 2,
        },
      ];
    }
  }

  remove(permission: any) {
    alert('remove!');
  }

  ngOnDestroy() {}

  cancel() {
    this.location.back();
  }
}
