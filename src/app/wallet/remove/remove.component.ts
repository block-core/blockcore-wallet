import { Component, Inject, HostBinding, OnDestroy, OnInit } from '@angular/core';
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
export class WalletRemoveComponent implements OnInit, OnDestroy {
  sub: any;

  constructor(
    private router: Router,
    private location: Location,
    private communication: CommunicationService,
    public uiState: UIState
  ) {
    this.uiState.title = 'Delete Wallet';

  }

  ngOnInit(): void {
    // Wait for the wallet to be removed before redirect to ensure state is correct.
    this.sub = this.communication.listen('wallet-removed', async (data: { accountId: string }) => {
      if (this.uiState.hasWallets) {
        this.router.navigateByUrl('/dashboard');
      } else {
        this.router.navigateByUrl('/wallet/create');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  async wipe() {
    // Remove the active wallet from the array.
    this.communication.send('wallet-remove', { walletId: this.uiState.persisted.activeWalletId });
  }

  cancel() {
    this.location.back();
  }
}
