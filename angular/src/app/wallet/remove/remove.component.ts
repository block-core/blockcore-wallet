import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState, LoggerService, WalletManager } from '../../services';
import { WalletStore } from 'src/shared';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-wallet-remove',
  templateUrl: './remove.component.html',
  styleUrls: ['../wallet.component.css']
})
export class WalletRemoveComponent implements OnInit, OnDestroy {
  DeleteYourWalletMessage: string;
  constructor(
    private router: Router,
    private location: Location,
    public walletManager: WalletManager,
    private store: WalletStore,
    private uiState: UIState,
    private logger: LoggerService,
    public translate: TranslateService,
  ) {

  }

  async ngOnInit() {
    this.uiState.title = await this.translate.get('Wallet.DeleteWallet').toPromise();
    this.DeleteYourWalletMessage = await this.translate.get('Wallet.DeleteYourWalletMessage', { name: this.walletManager.activeWallet.name}).toPromise() ;
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
      const walletId = this.walletManager.getWallets()[0].id;
      await this.walletManager.setActiveWallet(walletId);

      this.router.navigateByUrl('/dashboard');
    } else {
      this.router.navigateByUrl('/wallet/create');
    }
  }

  cancel() {
    this.location.back();
  }
}
