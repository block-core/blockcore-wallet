import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UIState, CommunicationService, NetworksService, NetworkStatusService, SettingsService, WalletManager, StateService } from '../services';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AccountHistory, NetworkStatus, TransactionHistory } from '../../shared/interfaces';
import { Subscription } from 'rxjs';
import { AccountHistoryStore } from 'src/shared';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit, OnDestroy {
  mnemonic = '';
  password = '';
  unlocked = '';
  unlockPassword = '';
  alarmName = 'refresh';
  address!: string;
  previousIndex!: number;
  sub: any;
  sub2: any;
  sub3: any;

  subscriptions: Subscription[] = [];

  loading = false;
  activities: any[] = [];
  public transactions: TransactionHistory[];
  public networkStatus: any;
  // private scanTimer: any;
  addresses: string[];
  currentNetworkStatus: NetworkStatus;
  public accountHistory: AccountHistory;

  constructor(
    public uiState: UIState,
    public settings: SettingsService,
    private http: HttpClient,
    private router: Router,
    private ngZone: NgZone,
    private network: NetworksService,
    private networkStatusService: NetworkStatusService,
    private communication: CommunicationService,
    private activatedRoute: ActivatedRoute,
    private readonly cd: ChangeDetectorRef,
    private state: StateService,
    private accountHistoryStore: AccountHistoryStore,
    public walletManager: WalletManager,
    private snackBar: MatSnackBar) {

    this.uiState.title = '';
    this.uiState.showBackButton = true;
    this.uiState.backUrl = '/dashboard';

    if (!this.walletManager.hasAccounts) {
      this.router.navigateByUrl('/account/create');
    }

    this.activatedRoute.paramMap.subscribe(async params => {
      console.log('PARAMS:', params);
      const accountIdentifier: any = params.get('index');

      if (!this.walletManager.activeWallet) {
        return;
      }

      // this.manager.setActiveAccountId(index);
      await this.walletManager.setActiveAccount(accountIdentifier);
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });

    this.subscriptions = [];

    // clearInterval(this.scanTimer);
  }

  async scan(force: boolean = false) {
    const accountHistory: AccountHistory = { balance: 0, unconfirmed: 0, history: [], unspent: [] };
    this.accountHistory = accountHistory;

    this.accountHistoryStore.set(this.walletManager.activeAccount.identifier, accountHistory);
    await this.accountHistoryStore.save();

    // Send a message to run indexing on all wallets.
    const msg = this.communication.createMessage('index');
    this.communication.send(msg);
  }

  async toggleNetwork() {
    if (!this.networkStatus) {
      try {
        const network = this.network.getNetwork(this.walletManager.activeAccount.networkType);
        const indexerUrl = this.settings.values.indexer.replace('{id}', network.id.toLowerCase());
        let result: any = await this.http.get(`${indexerUrl}/api/stats/info`).toPromise();
        this.networkStatus = result;
        console.log('NETWORK STATUS', this.networkStatus);
      }
      catch (error: any) {
        console.log('oops', error);

        if (error.error?.title) {
          this.snackBar.open('Error: ' + error.error.title, 'Hide', {
            duration: 8000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        } else {
          this.snackBar.open('Error: ' + error.message, 'Hide', {
            duration: 8000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        }
      }
    } else {
      this.networkStatus = null;
    }
  }

  updateNetworkStatus() {
    this.currentNetworkStatus = this.networkStatusService.get(this.walletManager.activeAccount.networkType);
  }

  get networkType() {
    return this.walletManager.activeAccount.networkType;
  }

  updateAccountHistory() {
    this.accountHistory = this.accountHistoryStore.get(this.walletManager.activeAccount.identifier);

    // If there are no account history yet (indexer has not been run for this wallet), set an empty history for UI to bind with:
    if (this.accountHistory == null) {
      this.accountHistory = {
        balance: 0,
        history: [],
        unconfirmed: 0,
        unspent: []
      };
    }

    // console.log('1:', this.accountHistoryStore);
    // console.log('2:', this.accountHistoryStore.get(this.walletManager.activeAccount.identifier))
    // console.log(this.accountHistory);
    // console.log(this.walletManager.activeAccount.identifier);

    console.log('accountHistory.history', this.accountHistory);

    this.cd.detectChanges();
  }

  async ngOnInit() {


    this.state.changed$.subscribe((state) => {
      this.ngZone.run(() => {
        console.log('state changed, update account history!');
        this.updateAccountHistory();
      });
    });

    this.updateNetworkStatus();

    this.subscriptions.push(this.walletManager.activeAccount$.subscribe((account) => {
      this.updateNetworkStatus();
      this.uiState.title = this.walletManager.activeAccount?.name || '';
      this.updateAccountHistory();
    }));
  }
}
