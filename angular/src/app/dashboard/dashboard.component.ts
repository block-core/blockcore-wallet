import { Component, ChangeDetectorRef, OnInit, OnDestroy, NgZone } from '@angular/core';
import {
  CryptoService, UIState, FeatureService, LoggerService, NetworksService,
  NetworkStatusService, DebugLogService, WalletManager, SecureStateService, CommunicationService, StateService
} from '../services';
import { ActivatedRoute, Router } from '@angular/router';
import { copyToClipboard } from '../shared/utilities';
import { Observable } from 'rxjs';
import { Account, NetworkStatus } from '../../shared/interfaces';
import { BackgroundManager } from 'src/shared/background-manager';
import { AccountHistoryStore } from 'src/shared';
import { AddressWatchStore } from 'src/shared/store/address-watch-store';
import { AccountStateStore } from 'src/shared/store/account-state-store';

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
  SmartContractAccounts : Account[];


  constructor(
    public feature: FeatureService,
    public uiState: UIState,
    public networkStatus: NetworkStatusService,
    private crypto: CryptoService,
    private router: Router,
    private logger: LoggerService,
    private network: NetworksService,
    private communication: CommunicationService,
    public walletManager: WalletManager,
    private secure: SecureStateService,
    private activatedRoute: ActivatedRoute,
    private accountHistoryStore: AccountHistoryStore,
    private addressWatchStore: AddressWatchStore,
    private state: StateService,
    private accountStateStore: AccountStateStore,
    private ngZone: NgZone,
    private debugLog: DebugLogService,
    private cd: ChangeDetectorRef) {

    this.uiState.showBackButton = false;

    if (this.walletManager.activeWallet) {
      this.uiState.title = this.walletManager.activeWallet.name;
    }
  }

  ngOnInit(): void {
    this.state.changed$.subscribe((state) => {
      this.ngZone.run(() => {
        this.cd.detectChanges();
      });
    });

    this.activatedRoute.paramMap.subscribe(async params => {
      // console.log('PARAMS:', params);
      const walletId: any = params.get('id');

      // If the wallet ID is provided in the URL, use it, if not, leave the existing active wallet.
      if (walletId) {
        // Set the active wallet if different from before.
        if (this.walletManager.activeWalletId != walletId) {
          await this.walletManager.setActiveWallet(walletId);

          // Check if the new wallet is unlocked, if not, go to home and unlock.
          if (!this.secure.unlocked(walletId)) {
            this.router.navigateByUrl('/home');
          }
        }
      }
    });

    // If anything redirected to dashboard without wallet being unlocked, go to home and unlock.
    if (!this.secure.unlocked(this.walletManager.activeWalletId)) {
      this.router.navigateByUrl('/home');
    }

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

  hasAccountHistory(accountId: string) {
    // const account = this.walletManager.getAccount(this.walletManager.activeWallet, accountId);
    const accountState = this.accountStateStore.get(accountId);
    return accountState?.lastScan != null;
  }

  balance(accountId: string) {
    const accountHistory = this.accountHistoryStore.get(accountId);

    if (accountHistory == null) {
      // If we don't have account history yet, simply return 0.
      return 0;
    } else if (accountHistory.balance == null) {
      // This means we have account history, but the wallet is probably empty (new) and has no not calculated balance ("no difference").
      return 0;
    } else {
      return accountHistory.balance;
    }
  }

  accountState(account: Account) {
    return this.accountStateStore.get(account.identifier);
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

  runIndexer() {
    // const manager = new BackgroundManager();
    // await manager.runIndexer();
    const msg = this.communication.createMessage('index', {}, 'background');
    this.communication.send(msg);
  }

  async logWatcher() {
    console.log(this.addressWatchStore);
  }

  getSmartContracts():Account[] {
  return this.SmartContractAccounts = this.walletManager.activeWallet.accounts
    .filter((item:Account) => item.networkType == "CRS");
}
}
