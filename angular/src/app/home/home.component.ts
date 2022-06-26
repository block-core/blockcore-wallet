import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CryptoService, UIState } from '../services';
import { Router } from '@angular/router';
import { CommunicationService, SecureStateService, WalletManager } from '../services';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  mnemonic = '';
  password = '';
  unlocked = '';
  unlockPassword = '';
  alarmName = 'refresh';
  wallet: any;
  error = '';
  sub2: any;

  constructor(public uiState: UIState, private crypto: CryptoService, private router: Router, private communication: CommunicationService, private secure: SecureStateService, public walletManager: WalletManager, private cd: ChangeDetectorRef) {
    console.log('HOME COMPONENT!');

    this.uiState.showBackButton = false;
    this.activateAlarm();

    // Verify if the wallet is already unlocked.
    if (this.walletManager.activeWallet) {
      this.uiState.title = `Unlock ${this.walletManager.activeWallet.name}`;

      if (this.secure.unlocked(this.walletManager.activeWallet?.id)) {

        console.log('Wallet already unlocked!!');

        if (this.uiState.action?.action) {
          this.router.navigate(['action', this.uiState.action.action]);
          console.log('THERE IS ACTION!');
        } else {
          console.log('No action...');
          this.router.navigateByUrl('/dashboard');
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this.sub2) {
      this.sub2.unsubscribe();
    }
  }

  async ngOnInit() {}

  removeError(): void {
    this.error = '';
  }

  activateAlarm() {}

  generate() {
    this.mnemonic = this.crypto.generateMnemonic();
  }

  async unlock() {
    this.error = null;

    if (this.walletManager.activeWallet) {
      const unlocked = await this.walletManager.unlockWallet(this.walletManager.activeWallet.id, this.unlockPassword);
      // this.manager.unlock(this.uiState.activeWallet.id, this.unlockPassword);

      if (unlocked) {
        if (this.uiState.action?.action) {
          this.router.navigate(['action', this.uiState.action.action]);
        } else {
          // If user has zero accounts, we'll show the account select screen that will auto-create accounts the user chooses.
          if (this.walletManager.hasAccounts) {
            this.router.navigateByUrl(`/dashboard/${this.walletManager.activeWalletId}`);
            //this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet.activeAccountIndex);
          } else {
            this.router.navigateByUrl('/account/select');
          }
        }
      } else {
        // TODO: Add text resource to i18n.
        this.error = 'Invalid password';
      }
    }
  }
}
