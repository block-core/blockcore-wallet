import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone, HostListener, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService, UIState, NetworksService, AppManager, WalletManager } from '../../services';
import { Router } from '@angular/router';
import { ActionService } from 'src/app/services/action.service';
// import * as browser from 'webextension-polyfill';
import { AccountState, AccountStateStore, ActionMessageResponse, Permission } from 'src/shared';
import { PermissionStore } from 'src/shared/store/permission-store';
import { Actions, PERMISSIONS } from 'src/app/shared/constants';
const { v4: uuidv4 } = require('uuid');

@Component({
  selector: 'app-sign-message',
  templateUrl: './sign.component.html',
  styleUrls: ['./sign.component.css'],
})
export class ActionSignMessageComponent implements OnInit, OnDestroy {
  accountState: AccountState;
  selectedKeyId: any;
  addresses: any[];
  // selectedAccountId: string;
  accounts: any[];
  subscription: any;

  constructor(public uiState: UIState, private accountStateStore: AccountStateStore, private permissionStore: PermissionStore, public action: ActionService, public networkService: NetworksService, public walletManager: WalletManager, private manager: AppManager, private cd: ChangeDetectorRef) {
    this.accounts = this.walletManager.activeWallet.accounts;
    // this.selectedAccountId = this.walletManager.activeAccountId;

    // Make sure we listen to active account changes to perform updated list of keys.
    // TODO: Figure out why subscribing to this on the prompt makes it trigger twice. Perhaps there is some code elsewhere that
    // needs fixing to avoid running the operation twice.
    // this.subscription = this.walletManager.activeAccount$.subscribe((a) => {
    //   this.update();
    // });
  }

  ngOnDestroy(): void {
    // this.subscription.unsubscribe();
  }

  // update() {
  //   const account = this.walletManager.activeAccount;
  //   this.accountState = this.accountStateStore.get(account.identifier);

  //   if (account.singleAddress || account.type === 'identity') {
  //     const address = this.accountState.receive[0];
  //     this.addresses = [{ address: address.address, keyId: '0/0' }];
  //   } else {
  //     const array1 = this.accountState.receive.map((r) => {
  //       return { address: r.address, keyId: '0/' + r.index };
  //     });
  //     const array2 = this.accountState.change.map((r) => {
  //       return { address: r.address, keyId: '1/' + r.index };
  //     });
  //     this.addresses = [...array1, ...array2];
  //   }

  //   this.selectedKeyId = this.addresses[0].keyId;
  // }

  ngOnInit(): void {}

  // async onAccountChanged() {
  //   await this.walletManager.setActiveAccount(this.selectedAccountId);

  //   // this.selectedNetwork = this.networkService.getNetwork(this.network);
  //   // this.derivationPath = this.getDerivationPath();
  //   // this.purposeAddress = this.selectedNetwork.purposeAddress ?? 44;
  // }

  // onKeyChanged() {
  //   // this.selectedNetwork = this.networkService.getNetwork(this.network);
  //   // this.derivationPath = this.getDerivationPath();
  //   // this.purposeAddress = this.selectedNetwork.purposeAddress ?? 44;
  // }
}
