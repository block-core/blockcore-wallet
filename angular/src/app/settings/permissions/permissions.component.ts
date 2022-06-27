import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Permission, PermissionDomain } from 'src/shared';
import { PermissionStore } from 'src/shared/store/permission-store';
import { UIState, FeatureService, NetworkStatusService } from '../../services';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PermissionsComponent implements OnDestroy, OnInit {
  permissions: PermissionDomain[];

  constructor(public uiState: UIState, public location: Location, public networkStatus: NetworkStatusService, public feature: FeatureService, private permissionStore: PermissionStore) {
    this.uiState.title = 'Permissions';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;
  }

  async ngOnInit() {
    // Make sure we reload the permission store every time user opens the UI.
    // this.permissionStore.load();
    await this.refresh();
  }

  async remove(permission: Permission, permissionSet: PermissionDomain) {
    delete permissionSet.permissions[permission.action];
    await this.permissionStore.save();
    await this.refresh();
  }

  async refresh() {
    await this.permissionStore.load();
    this.permissions = this.permissionStore.all();
    console.log(this.permissions);
  }

  toArray(items: any): Permission[] {
    return Object.values(items);
  }

  ngOnDestroy() {}

  cancel() {
    this.location.back();
  }

  async removeAllPermissions() {
    await this.permissionStore.wipe();
    await this.refresh();
  }
}
