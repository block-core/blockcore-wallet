import { Component, Inject, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState } from '../../services/ui-state.service';
import { CommunicationService } from '../../services/communication.service';
import { IconService } from '../../services/icon.service';
import { WalletManager } from '../../services/wallet-manager';

@Component({
  selector: 'app-vault-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['../vault.component.css']
})
export class VaultEditComponent implements OnInit, OnDestroy {

  accountName: string | undefined;
  sub: any;
  sub2: any;
  icon: string | undefined;

  constructor(
    private router: Router,
    private location: Location,
    public uiState: UIState,
    public icons: IconService,
    private walletManager: WalletManager,
    private communication: CommunicationService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.uiState.title = 'Edit Account'

    this.activatedRoute.paramMap.subscribe(async params => {
      console.log('ROUTE CHANGE 1');
      const index: any = params.get('index');

      if (!this.walletManager.activeWallet) {
        console.log('ROUTE CHANGE 3');
        return;
      }

      // this.manager.setActiveAccountId(index);
      this.accountName = this.walletManager.activeAccount?.name;
      this.icon = this.walletManager.activeAccount?.icon;
      console.log('ROUTE CHANGE 2');
    });

    // this.sub2 = this.walletManager.activeAccount$.subscribe(() => {
    //   this.accountName = this.walletManager.activeAccount?.name;
    //   this.icon = this.walletManager.activeAccount?.icon;
    //   console.log('ROUTE CHANGE 2');
    // });
  }

  ngOnInit() {
    this.sub = this.communication.listen('account-updated', () => {
      this.location.back();
    });
  }

  changeIcon(icon: string) {
    // if (this.uiState.activeAccount) {
    //   this.uiState.activeAccount.icon = icon;
    // }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.communication.unlisten(this.sub);
    }

    if (this.sub2) {
      this.sub2.unsubscribe();
    }
  }

  async save() {
    if (!this.walletManager.activeWallet) {
      this.location.back();
      return;
    }

    // We won't allow empty names for accounts.
    if (this.accountName) {
      const wallet = this.walletManager.activeWallet;
      const accountId = this.walletManager.activeWallet.activeAccountId;

      if (!wallet) {
        return;
      }

      const accountIndex = wallet.accounts.findIndex(a => a.identifier == accountId);
      const account = wallet.accounts[accountIndex];
      account.name = this.accountName;
      account.icon = this.icon;

      await this.uiState.save();

      this.location.back();
    }
  }

  cancel() {
    this.location.back();
  }
}
