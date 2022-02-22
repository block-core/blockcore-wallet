import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState } from '../../services/ui-state.service';
import { LoggerService } from '../../services/logger.service';
import { WalletManager } from '../../../background/wallet-manager';

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

      // Update the previous wallet ID with the one we just picked.
      this.uiState.persisted.previousWalletId = walletId;

      // this.orchestrator.setActiveWalletId(walletId);
      // Also make a change in current state since we are not waiting for callback event from background.
      // this.uiState.persisted.activeWalletId = walletId;

      this.router.navigateByUrl('/home');
    } else {
      this.router.navigateByUrl('/wallet/create');
    }
  }

  cancel() {
    this.location.back();
  }
}
