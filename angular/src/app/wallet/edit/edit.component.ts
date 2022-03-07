import { Component, Inject, HostBinding } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState, CommunicationService, WalletManager } from '../../services';

@Component({
  selector: 'app-wallet-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['../wallet.component.css']
})
export class WalletEditComponent {

  walletName: string | undefined;

  constructor(
    private router: Router,
    private location: Location,
    public walletManager: WalletManager,
    public uiState: UIState
  ) {
    this.uiState.title = 'Edit Wallet'
    this.walletName = this.walletManager.activeWallet?.name;
  }

  async save() {
    if (!this.walletManager.activeWallet || !this.walletName) {
      return;
    }

    this.walletManager.activeWallet.name = this.walletName;

    await this.walletManager.save();

    this.location.back();
  }

  cancel() {
    this.location.back();
  }
}
