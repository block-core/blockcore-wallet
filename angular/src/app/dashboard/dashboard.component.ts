import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CryptoService, UIState, FeatureService, LoggerService, NetworksService, NetworkStatusService, DebugLogService, WalletManager, SecureStateService } from '../services';
import { ActivatedRoute, Router } from '@angular/router';
import { copyToClipboard } from '../shared/utilities';
import { Observable } from 'rxjs';
import { NetworkStatus } from '../interfaces';
import { combineLatest } from 'rxjs';

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
    private secure: SecureStateService,
    private activatedRoute: ActivatedRoute,
    private debugLog: DebugLogService,
    private cd: ChangeDetectorRef) {

    this.uiState.showBackButton = false;

    this.logger.info('Dashboard was opened');

    if (this.walletManager.activeWallet) {
      this.uiState.title = this.walletManager.activeWallet.name;
    }




  }

  ngOnInit(): void {
    // EXAMPLE ON COLLECTING BOTH PARAMS AND DATA... left here if we ever need it.
    // combineLatest(
    //   this.route.params,
    //   this.route.data,
    //   (params: Params, data: Data) => ({
    //     params,
    //     data,
    //   })
    // ).subscribe((res: { params: Params; data: Data }) => {
    //   const { params, data } = res;

    //   this.getBook(params.id, data.uid);
    // });

    this.activatedRoute.paramMap.subscribe(async params => {

      console.log('PARAMS:', params);
      const walletId: any = params.get('id');
      console.log('Wallet ID:', walletId);

      // Set the active wallet if different from before.
      if (this.walletManager.activeWalletId != walletId) {
        await this.walletManager.setActiveWallet(walletId);

        // Check if the new wallet is unlocked, if not, go to home and unlock.
        if (!this.secure.unlocked(walletId)) {
          this.router.navigateByUrl('/home');
        }
      }

      // const accountCount = this.walletManager.activeWallet?.accounts?.length;

      // if (this.walletManager.activeWallet) {
      //   // Check if the index is available before allowing to change.
      //   if (accountId && accountCount != null) {
      //     this.walletManager.activeWallet.activeAccountId = accountId;
      //   }
      //   else {
      //     console.log('Attempting to show account that does not exists.');
      //     this.router.navigateByUrl('/account');
      //   }
      // }
      // else {
      //   console.log('Attempting to show account when no wallet is selected.');
      //   this.router.navigateByUrl('/');
      // }
    });

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
