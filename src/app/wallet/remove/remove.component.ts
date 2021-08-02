import { Component, Inject, HostBinding } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common'
import { ApplicationState } from 'src/app/services/application-state.service';

@Component({
  selector: 'app-wallet-remove',
  templateUrl: './remove.component.html',
  styleUrls: ['../wallet.component.css']
})
export class WalletRemoveComponent {
  constructor(
    private router: Router,
    private location: Location,
    public appState: ApplicationState
  ) {

    this.appState.title = 'Delete Wallet';
  }

  async wipe() {
    // Remove the active wallet from the array.
    this.appState.persisted.wallets.splice(this.appState.persisted.activeWalletIndex, 1);

    if (this.appState.hasWallets) {
      this.appState.persisted.activeWalletIndex = 0;
    } else {
      this.appState.persisted.activeWalletIndex = -1;
    }

    await this.appState.save();

    if (this.appState.hasWallets) {
      this.router.navigateByUrl('/home');
    } else {
      this.router.navigateByUrl('/wallet/create');
    }

  }

  cancel() {
    this.location.back();
  }
}
