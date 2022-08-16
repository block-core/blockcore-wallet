import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Permission, PermissionDomain } from 'src/shared';
import { PermissionStore } from 'src/shared/store/permission-store';
import { UIState, FeatureService, NetworkStatusService, WalletManager } from '../../services';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PermissionsComponent implements OnDestroy, OnInit {
  permissions: PermissionDomain[];

  constructor(private walletManager: WalletManager, public uiState: UIState, public location: Location, public networkStatus: NetworkStatusService, public feature: FeatureService, private permissionStore: PermissionStore) {
    this.uiState.title = 'Permissions';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;
  }

  async ngOnInit() {
    // Make sure we reload the permission store every time user opens the UI.
    // this.permissionStore.load();
    await this.refresh();
  }

  getWalletName(walletId: string) {
    return this.walletManager.getWallet(walletId)?.name;
  }

  getAccountName(walletId: string, accountId: string) {
    const wallet = this.walletManager.getWallet(walletId);
    return this.walletManager.getAccount(wallet, accountId)?.name;
  }

  async remove(permission: Permission, permissionSet: PermissionDomain) {

    const permissions = permissionSet.permissions[permission.action] as Permission[];

    debugger;
    const index = permissions.findIndex((p) => p.key == permission.key);

    if (index > -1) {
      permissions.splice(index, 1);
    }

    // delete permissionSet.permissions[permission.action];

    await this.permissionStore.save();
    await this.refresh();
  }

  async refresh() {
    await this.permissionStore.load();
    this.permissions = this.permissionStore.all();
    console.log(this.permissions);
  }

  toArray(items: any): Permission[][] {
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
