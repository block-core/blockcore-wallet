import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CryptoService, UIState, FeatureService, LoggerService, NetworksService, NetworkStatusService, DebugLogService, WalletManager } from '../services';
import { Router } from '@angular/router';
import { copyToClipboard } from '../shared/utilities';
import { Observable } from 'rxjs';
import { NetworkStatus } from '../interfaces';

export interface Section {
  name: string;
  updated: Date;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  mnemonic = '';
  password = '';
  unlocked = '';
  unlockPassword = '';
  alarmName = 'refresh';
  wallet: any;
  sub: any;
  history: Section[] = [];
  networkStatus$: Observable<NetworkStatus[]>;

  constructor(
    public feature: FeatureService,
    public uiState: UIState,
    public networkStatus: NetworkStatusService,
    private crypto: CryptoService,
    private router: Router,
    private logger: LoggerService,
    private network: NetworksService,
    public walletManager: WalletManager,
    private debugLog: DebugLogService,
    private cd: ChangeDetectorRef) {

    this.uiState.showBackButton = false;

    this.logger.info('Dashboard was opened');

    if (this.walletManager.activeWallet) {
      this.uiState.title = this.walletManager.activeWallet.name;
    }
  }

  ngOnInit(): void {
    // TODO: activeWalletUnlocked IS FALSE ON FIRST UNLOCK!!!
    this.sub = this.walletManager.activeWallet$.subscribe(() => {
      if (this.walletManager.activeWallet) {
        this.uiState.title = this.walletManager.activeWallet.name;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  copyDebugLogs() {
    // Access internal writer to get logs:
    const entries = JSON.stringify(this.debugLog.logs);
    copyToClipboard(entries);
  }

  copyErrorLogs() {
    // Access internal writer to get logs:
    const entries = JSON.stringify(this.debugLog.errors);
    copyToClipboard(entries);
  }
}
