import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState, LoggerService, WalletManager } from '../../services';

@Component({
  selector: 'app-wallet-remove',
  templateUrl: './remove.component.html',
  styleUrls: ['../wallet.component.css']
})
export class WalletRemoveComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private location: Location,
    public walletManager: WalletManager,
    private uiState: UIState,
    private logger: LoggerService
  ) {
    this.uiState.title = 'Delete Wallet';
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {

  }

  async wipe() {
    this.logger.info('Removing wallet:', this.walletManager.activeWalletId);
    // Remove the active wallet from the array.
    await this.walletManager.removeWallet(this.walletManager.activeWalletId);
    this.logger.info('Wallet removed.');

    if (this.walletManager.hasWallets) {
      // Just grab the last wallet after removing one.
      const walletId = this.uiState.persisted.wallets[this.uiState.persisted.wallets.length - 1].id;

      this.walletManager.setActiveWallet(walletId);

      this.router.navigateByUrl('/dashboard');
    } else {
      this.router.navigateByUrl('/wallet/create');
    }
  }

  cancel() {
    this.location.back();
  }
}
