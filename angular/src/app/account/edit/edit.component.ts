import { Component, Inject, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState } from '../../services/ui-state.service';
import { OrchestratorService } from '../../services/orchestrator.service';
import { CommunicationService } from '../../services/communication.service';
import { IconService } from '../../services/icon.service';
import { WalletManager } from '../../../background/wallet-manager';

@Component({
  selector: 'app-account-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['../account.component.css']
})
export class AccountEditComponent implements OnInit, OnDestroy {

  accountName: string | undefined;
  sub2: any;
  icon: string | undefined;

  constructor(
    private router: Router,
    private location: Location,
    public uiState: UIState,
    public icons: IconService,
    private manager: OrchestratorService,
    private communication: CommunicationService,
    private walletManager: WalletManager,
    private activatedRoute: ActivatedRoute,
  ) {
    this.uiState.title = 'Edit Account'

    this.activatedRoute.paramMap.subscribe(async params => {
      console.log('ROUTE CHANGE 1');
      const index: any = params.get('index');

      if (!this.uiState.activeWallet) {
        console.log('ROUTE CHANGE 3');
        return;
      }

      this.manager.setActiveAccountId(index);
      this.accountName = this.uiState.activeAccount?.name;
      this.icon = this.uiState.activeAccount?.icon;
      console.log('ROUTE CHANGE 2');
    });

    this.sub2 = this.uiState.activeAccount$.subscribe(() => {
      this.accountName = this.uiState.activeAccount?.name;
      this.icon = this.uiState.activeAccount?.icon;
      console.log('ROUTE CHANGE 2');
    });
  }

  ngOnInit() {

  }

  changeIcon(icon: string) {
    if (this.uiState.activeAccount) {
      this.uiState.activeAccount.icon = icon;
    }
  }

  ngOnDestroy(): void {
    if (this.sub2) {
      this.sub2.unsubscribe();
    }
  }

  async save() {
    if (!this.uiState.activeWallet) {
      this.location.back();
      return;
    }

    // We won't allow empty names for accounts.
    if (this.accountName) {
      const wallet = this.uiState.activeWallet;
      const accountId = this.uiState.activeWallet.activeAccountId;

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
