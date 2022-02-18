import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CryptoService } from '../services/crypto.service';
import { UIState } from '../services/ui-state.service';
import { Router } from '@angular/router';
import { FeatureService } from '../services/features.service';
import { copyToClipboard } from '../shared/utilities';
import { LoggerService } from '../services/logger.service';
import { NetworksService } from '../services/networks.service';
import { NetworkStatusService } from '../services/network-status.service';
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
    private cd: ChangeDetectorRef) {

    this.uiState.showBackButton = false;

    this.logger.info('Dashboard was opened');

    if (this.uiState.activeWallet) {
      this.uiState.title = this.uiState.activeWallet.name;
    }
  }

  ngOnInit(): void {
    // TODO: activeWalletUnlocked IS FALSE ON FIRST UNLOCK!!!
    this.sub = this.uiState.activeWallet$.subscribe(() => {
      if (this.uiState.activeWallet) {
        this.uiState.title = this.uiState.activeWallet.name;
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
    const logger = this.logger as any;
    const entries = JSON.stringify(logger.writerService.logs);
    copyToClipboard(entries);
  }

  copyErrorLogs() {
    // Access internal writer to get logs:
    const logger = this.logger as any;
    const entries = JSON.stringify(logger.writerService.errors);
    copyToClipboard(entries);
  }
}
