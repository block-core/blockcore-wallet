import { Component, ChangeDetectorRef, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CryptoService, UIState, FeatureService, LoggerService, NetworksService, NetworkStatusService, DebugLogService, WalletManager, SecureStateService, CommunicationService, StateService } from '../services';
import { ActivatedRoute, Router } from '@angular/router';
import { copyToClipboard } from '../shared/utilities';
import { Observable } from 'rxjs';
import { Account, NetworkStatus } from '../../shared/interfaces';
import { BackgroundManager } from 'src/shared/background-manager';
import { AccountHistoryStore } from 'src/shared';
import { AddressWatchStore } from 'src/shared/store/address-watch-store';
import { AccountStateStore } from 'src/shared/store/account-state-store';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { QrScanDialog } from '../account/send/address/qr-scanning.component';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { PaymentRequest } from 'src/shared/payment';

export interface Section {
  name: string;
  updated: Date;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
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
  smartContractAccounts: Account[];
  totalCollectablesCount: number;
  stratisphereUrl: string = 'https://stratisphere.com/';

  constructor(
    public feature: FeatureService,
    public uiState: UIState,
    private paymentRequest: PaymentRequest,
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
    public dialog: MatDialog,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {
    this.uiState.showBackButton = false;
    this.totalCollectablesCount = 0;

    if (this.walletManager.activeWallet) {
      this.uiState.title = this.walletManager.activeWallet.name;
    }
  }

  ngOnInit(): void {
    // If there is a payment request waiting, we'll do this first:
    if (this.uiState.payment) {
      this.router.navigateByUrl('/payment');
      return;
    }

    this.state.changed$.subscribe((state) => {
      this.ngZone.run(() => {
        this.cd.detectChanges();
      });
    });

    this.activatedRoute.paramMap.subscribe(async (params) => {
      const walletId: any = params.get('id');

      // If the wallet ID is provided in the URL, use it, if not, leave the existing active wallet.
      if (walletId) {
        // Set the active wallet if different from before.
        if (this.walletManager.activeWalletId != walletId) {
          console.log('DASHBOARD SET ACTIVE WALLET!');
          await this.walletManager.setActiveWallet(walletId);

          // Check if the new wallet is unlocked, if not, go to home and unlock.
          if (!this.secure.unlocked(walletId)) {
            this.router.navigateByUrl('/home');
          }
        }
      }

      this.smartContractAccounts = this.walletManager.activeWallet.accounts.filter((item: Account) => this.network.getNetwork(item.networkType).smartContractSupport);
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

  scanPayment() {
    const dialogRef = this.dialog.open(QrScanDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('QR SCAN RESULT', result);

      if (!result) {
        return;
      }

      // Perform basic check if this result is an address QR or payment request.
      if (result.indexOf(':') == -1) {
        this.snackBar.open(`Scanned QR code is not a payment request. Value: ${result}`, 'Hide', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      } else {
        const payment = this.paymentRequest.decode(result);

        if (payment.network && payment.network != 'http' && payment.network != 'https') {
          this.uiState.payment = payment;
          this.router.navigateByUrl('/payment');
        } else {
          this.snackBar.open(`Scanned QR code is not a valid payment request. Value: ${result}`, 'Hide', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        }
      }
    });
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

  // runIndexer() {
  //   const msg = this.communication.createMessage('index', {}, 'background');
  //   this.communication.send(msg);
  // }

  getLink(account: Account) {
    if (account.type == 'identity') {
      return ['/', 'account', 'identity', account.identifier];
    } else {
      return ['/', 'account', 'view', account.identifier];
    }
  }

  async logWatcher() {
    this.logger.info(this.addressWatchStore);
  }

  addToTotalItems(totalOnAccount: number) {
    this.totalCollectablesCount += totalOnAccount;
  }
}
