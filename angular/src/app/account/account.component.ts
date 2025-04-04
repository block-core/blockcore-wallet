import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UIState, CommunicationService, NetworksService, NetworkStatusService, SettingsService, WalletManager, StateService } from '../services';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Account, AccountHistory, NetworkStatus, TransactionHistory, Token } from '../../shared/interfaces';
import { Subscription } from 'rxjs';
import { AccountHistoryStore, AddressStore, NetworkLoader } from 'src/shared';
import { AccountStateStore } from 'src/shared/store/account-state-store';
import axiosRetry from 'axios-retry';
const axios = require('axios').default;
import { StandardTokenStore } from '../../shared/store/standard-token-store';
import { MessageService } from 'src/shared';
import { TranslateService } from '@ngx-translate/core';
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
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

  loginurl: string;
  loginurlMessage: string;

  standardTokens: Token[];

  constructor(
    public uiState: UIState,
    public settings: SettingsService,
    private http: HttpClient,
    private router: Router,
    private ngZone: NgZone,
    private network: NetworksService,
    private networkStatusService: NetworkStatusService,
    private message: MessageService,
    private activatedRoute: ActivatedRoute,
    private readonly cd: ChangeDetectorRef,
    private state: StateService,
    private accountHistoryStore: AccountHistoryStore,
    private addressStore: AddressStore,
    public walletManager: WalletManager,
    private accountStateStore: AccountStateStore,
    private networkLoader: NetworkLoader,
    private snackBar: MatSnackBar,
    private standardTokenStore: StandardTokenStore,
    public translate: TranslateService
  ) {
    this.uiState.title = '';
    this.uiState.showBackButton = true;
    this.uiState.backUrl = '/dashboard';

    if (!this.walletManager.hasAccounts) {
      this.router.navigateByUrl('/account/create');
    }

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const accountIdentifier: any = params.get('index');

        if (!this.walletManager.activeWallet) {
          return;
        }

        await this.walletManager.setActiveAccount(accountIdentifier);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });

    this.subscriptions = [];
  }

  async scan() {
    this.loading = true;

    const account = this.walletManager.activeAccount;
    const accountState = this.accountStateStore.get(account.identifier);

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

    // Remove the account state store when performing a re-scan.
    // Reset the account state when performing a re-scan.
    accountState.balance = 0;
    this.accountStateStore.set(account.identifier, accountState);
    await this.accountStateStore.save();

    debugger;

    // Send a message to run indexing on all wallets, send accountId for future optimization of running index only on this account.
    this.message.send(this.message.createMessage('index', { accountId: this.walletManager.activeAccount.identifier }));

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
      } catch (error: any) {
        console.error(error);

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

  async callLogin() {
    // sid:auth-api.opdex.com/v1/ssas/callback?uid=aDxrmQ8wDKUruKEzD17HJqPZSinveFEQaS1MbjMnXhG4_qtd92-Jjs_7sh3ajuo0peelx87-MvQV4MzvxafCpg&exp=1656544738
    console.info(this.loginurl);

    try {
      var expIndex = this.loginurl.indexOf('exp=');
      var expirationStr: any;
      if (expIndex != -1) {
        // Wallet should verify that the expiry datetime has not passed, if it is present
        // https://github.com/Opdex/SSAS/blob/main/README.md#wallet-compatibility

        expirationStr = this.loginurl.substring(expIndex + 4);
        var currentDate = new Date();
        var expiryDate = new Date(expirationStr * 1000);

        if (expiryDate < currentDate) {
          this.loginurlMessage = await this.translate.get('Account.LoginLinkExpired').toPromise();
          return;
        }
      }

      var parsedUrl = this.loginurl.substring(4);

      var activeAccount = this.walletManager.activeAccount;
      var activeWallet = this.walletManager.activeWallet;

      var address = await this.walletManager.getPrimaryAddress(activeAccount);
      var signature = await this.walletManager.signData(activeWallet, activeAccount, address, parsedUrl);

      const payload = {
        signature: signature,
        publicKey: address,
      };

      var callback = 'https://' + parsedUrl;
      const authRequest = await axios.post(callback, payload);

      this.loginurlMessage = '';
      this.loginurl = '';
    } catch (error) {
      this.loginurlMessage = error.toString();
    }
  }

  // updateNetworkStatus() {
  //   this.currentNetworkStatus = this.networkStatusService.get(this.walletManager.activeAccount.networkType);
  // }

  get networkType() {
    return this.walletManager.activeAccount.networkType;
  }

  public history: TransactionHistory[] = [];

  updateAccountHistory() {
    if (this.walletManager.activeAccount == null) {
      return;
    }

    this.accountHistory = this.accountHistoryStore.get(this.walletManager.activeAccount.identifier);

    // If there are no account history yet (indexer has not been run for this wallet), set an empty history for UI to bind with:
    if (this.accountHistory == null) {
      this.accountHistory = {
        balance: 0,
        history: [],
        unconfirmed: 0,
        unspent: [],
      };
    }

    this.history = this.accountHistory.history;

    this.cd.detectChanges();
  }

  loadTokens() {
    let accountTokens = this.standardTokenStore.get(this.walletManager.activeAccount.identifier);
    if (accountTokens != undefined) {
      this.standardTokens = accountTokens.tokens;
    }
  }

  async ngOnInit() {
    this.subscriptions.push(
      this.state.changed$.subscribe((state) => {
        this.ngZone.run(() => {
          this.updateAccountHistory();
        });
      })
    );

    // this.updateNetworkStatus();

    this.subscriptions.push(
      this.walletManager.activeAccount$.subscribe((account) => {
        // this.updateNetworkStatus();
        this.uiState.title = this.walletManager.activeAccount?.name || '';
        this.updateAccountHistory();
      })
    );

    const network = this.network.getNetwork(this.walletManager.activeAccount.networkType);

    if (network.smartContractSupport) {
      this.loadTokens();
      await this.walletManager.loadStandardTokensForAccountAsync(network, this.walletManager.activeAccount);
      this.loadTokens();
    }
  }
}
