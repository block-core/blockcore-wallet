import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UIState, CommunicationService, NetworksService, NetworkStatusService, SettingsService, WalletManager, StateService, NetworkLoader } from '../services';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Account, AccountHistory, NetworkStatus, TransactionHistory } from '../../shared/interfaces';
import { Subscription } from 'rxjs';
import { AccountHistoryStore, AddressStore } from 'src/shared';
import { AccountStateStore } from 'src/shared/store/account-state-store';

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
    private addressStore: AddressStore,
    public walletManager: WalletManager,
    private accountStateStore: AccountStateStore,
    private networkLoader: NetworkLoader,
    private snackBar: MatSnackBar) {

    this.uiState.title = '';
    this.uiState.showBackButton = true;
    this.uiState.backUrl = '/dashboard';

    if (!this.walletManager.hasAccounts) {
      this.router.navigateByUrl('/account/create');
    }

    this.subscriptions.push(this.activatedRoute.paramMap.subscribe(async params => {
      console.log('PARAMS:', params);
      const accountIdentifier: any = params.get('index');

      if (!this.walletManager.activeWallet) {
        return;
      }

      // this.manager.setActiveAccountId(index);
      await this.walletManager.setActiveAccount(accountIdentifier);
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });

    this.subscriptions = [];

    // clearInterval(this.scanTimer);
  }

  async scan() {
    const account = this.walletManager.activeAccount;
    const accountState = this.accountStateStore.get(account.identifier);

    this.loading = true;
    const accountHistory: AccountHistory = { balance: 0, unconfirmed: 0, history: [], unspent: [] };
    this.accountHistory = accountHistory;

    this.accountHistoryStore.set(account.identifier, accountHistory);
    await this.accountHistoryStore.save();

    // TODO: Refactor, add a method to address store that can take array of addresses for
    // the remove operation, then we can simply map all addresses, combine in an array and provide that.
    for (var i = 0; i < accountState.receive.length; i++) {
      this.addressStore.remove(accountState.receive[i].address);
    }

    for (var i = 0; i < accountState.change.length; i++) {
      this.addressStore.remove(accountState.change[i].address);
    }

    await this.addressStore.save();

    console.log('accountHistoryStore (before):', this.accountStateStore.all());

    // Remove the account state store when performing a re-scan.
    // Reset the account state when performing a re-scan.
    accountState.balance = 0;
    this.accountStateStore.set(account.identifier, accountState);
    this.accountStateStore.save();

    console.log('accountHistoryStore (after):', this.accountStateStore.all());

    // Send a message to run indexing on all wallets, send accountId for future optimization of running index only on this account.
    const msg = this.communication.createMessage('index', { force: true, accountId: this.walletManager.activeAccount.identifier });
    this.communication.send(msg);
    this.loading = false;
  }

  accountState(account: Account) {
    return this.accountStateStore.get(account.identifier);
  }

  async toggleNetwork() {
    if (!this.networkStatus) {
      try {
        const network = this.network.getNetwork(this.walletManager.activeAccount.networkType);
        // const indexerUrl = this.settings.values.indexer.replace('{id}', network.id.toLowerCase());
        const indexerUrl = this.networkLoader.getServer(network.id, this.settings.values.server, this.settings.values.indexer);

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
    if (this.walletManager.activeAccount == null) {
      return;
    }

    // Make sure we first reload the store to ensure we get latest items.
    // await this.accountHistoryStore.load();

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
    this.subscriptions.push(this.state.changed$.subscribe((state) => {
      this.ngZone.run(() => {
        console.log('state changed, update account history!');
        this.updateAccountHistory();
      });
    }));

    this.updateNetworkStatus();

    this.subscriptions.push(this.walletManager.activeAccount$.subscribe((account) => {
      this.updateNetworkStatus();
      this.uiState.title = this.walletManager.activeAccount?.name || '';
      this.updateAccountHistory();
    }));
  }
}
