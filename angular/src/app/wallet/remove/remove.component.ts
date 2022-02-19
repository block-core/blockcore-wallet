import { Component, Inject, HostBinding, OnDestroy, OnInit, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState } from '../../services/ui-state.service';
import { CommunicationService } from '../../services/communication.service';
import { LoggerService } from '../../services/logger.service';
import { OrchestratorService } from '../../services/orchestrator.service';

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
    private orchestrator: OrchestratorService,
    public uiState: UIState,
    private logger: LoggerService
  ) {
    this.uiState.title = 'Delete Wallet';
  }

  ngOnInit(): void {
    // Wait for the wallet to be removed before redirect to ensure state is correct.
    this.sub = this.communication.listen('wallet-removed', async (data: { accountId: string }) => {
      this.logger.info('Wallet removed.');

      // this.ngZone.run(() => {
      if (this.uiState.hasWallets) {
        // Just grab the last wallet after removing one.
        const walletId = this.uiState.persisted.wallets[this.uiState.persisted.wallets.length - 1].id;

        this.orchestrator.setActiveWalletId(walletId);

        // Also make a change in current state since we are not waiting for callback event from background.
        this.uiState.persisted.activeWalletId = walletId;

        this.router.navigateByUrl('/home');
      } else {
        this.router.navigateByUrl('/wallet/create');
      }
      // });

    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.communication.unlisten(this.sub);
    }
  }

  async wipe() {
    this.logger.info('Removing wallet:', this.uiState.persisted.activeWalletId);

    // Remove the active wallet from the array.
    this.communication.send('wallet-remove', { walletId: this.uiState.persisted.activeWalletId });
  }

  cancel() {
    this.location.back();
  }
}
