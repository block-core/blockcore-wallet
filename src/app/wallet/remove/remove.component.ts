import { Component, Inject, HostBinding } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState } from 'src/app/services/ui-state.service';
import { CommunicationService } from 'src/app/services/communication.service';

@Component({
  selector: 'app-wallet-remove',
  templateUrl: './remove.component.html',
  styleUrls: ['../wallet.component.css']
})
export class WalletRemoveComponent {
  constructor(
    private router: Router,
    private location: Location,
    private communication: CommunicationService,
    public uiState: UIState
  ) {
    this.uiState.title = 'Delete Wallet';

  }

  async wipe() {
    // Remove the active wallet from the array.
    this.communication.send('wallet-remove', { walletId: this.uiState.persisted.activeWalletId });

    // this.uiState.persisted.wallets.splice(this.uiState.persisted.activeWalletIndex, 1);

    // if (this.uiState.hasWallets) {
    //   this.uiState.persisted.activeWalletIndex = 0;
    // } else {
    //   this.uiState.persisted.activeWalletIndex = -1;
    // }

    // await this.uiState.save();

    if (this.uiState.hasWallets) {
      this.router.navigateByUrl('/home');
    } else {
      this.router.navigateByUrl('/wallet/create');
    }

  }

  cancel() {
    this.location.back();
  }
}
