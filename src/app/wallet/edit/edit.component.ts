import { Component, Inject, HostBinding } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState } from 'src/app/services/ui-state.service';
import { CommunicationService } from 'src/app/services/communication.service';

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
    private communication: CommunicationService,
    public uiState: UIState
  ) {
    this.uiState.title = 'Edit Wallet'
    this.walletName = this.uiState.activeWallet?.name;
  }

  async save() {
    this.communication.send('wallet-rename', this.walletName);

    // if (this.uiState.activeWallet) {
    //   this.uiState.activeWallet.name = this.walletName;
    //   await this.uiState.save();
    // }

    // this.router.navigateByUrl('/home');
    this.location.back();
  }

  cancel() {
    this.location.back();
  }
}
