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

    this.refresh();
  }

  ngOnInit(): void {
    // Make sure we reload the permission store every time user opens the UI.
    // this.permissionStore.load();
  }

  remove(id: string) {
    this.permissionStore.remove(id);
    this.permissionStore.save();
    this.refresh();
  }

  refresh() {
    this.permissions = this.permissionStore.all();
    console.log(this.permissions);
  }

  ngOnDestroy() {}

  cancel() {
    this.location.back();
  }

  removeAllPermissions() {
    this.permissionStore.wipe();
    this.refresh();
  }
}
