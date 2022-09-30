import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { WalletManager, NetworksService, UIState, NetworkStatusService, EnvironmentService } from '../../services';
import { Account, Defaults } from '../../../shared';
import { MessageService } from 'src/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-account-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css'],
})
export class AccountSelectComponent implements OnInit, OnDestroy {
  coins: Account[];
  coinsTest: Account[];
  identity: Account[];
  sub: any;
  creating = false;

  constructor(
    private uiState: UIState,
    private networkService: NetworksService,
    public walletManager: WalletManager,
    private message: MessageService,
    private networkStatus: NetworkStatusService,
    private env: EnvironmentService,
    private router: Router,
    private snackBar: MatSnackBar,
    public translate: TranslateService
  ) {
    uiState.showBackButton = true;
  }

  async ngOnInit(): Promise<void> {
    this.uiState.title = await this.translate.get('Account.SelectAccounts').toPromise();
    // Get the default accounts for the current wallet:
    const accounts = Defaults.getDefaultAccounts(this.env.instance);

    this.coins = accounts.filter((item) => (item.type === 'coin' || item.type === 'token') && !this.networkService.getNetwork(item.networkType).testnet);
    this.coinsTest = accounts.filter((item) => (item.type === 'coin' || item.type === 'token') && this.networkService.getNetwork(item.networkType).testnet);
    this.identity = accounts.filter((item) => item.type === 'identity');

    // this.sub = this.communication.listen('account-created', () => {
    //     this.router.navigateByUrl('/dashboard');
    // });
  }

  ngOnDestroy(): void {
    // if (this.sub) {
    //     this.communication.unlisten(this.sub);
    // }
  }

  async create() {
    this.creating = true;

    const accounts = this.coins.filter((item) => item.selected);
    accounts.push(...this.coinsTest.filter((item) => item.selected));
    accounts.push(...this.identity.filter((item) => item.selected));

    const wallet = this.walletManager.activeWallet;

    for (const account of accounts) {
      // Don't persist the selected value.
      // DUE TO BINDING WARNING IN DEBUG MODE, WE'LL KEEP THE SELECTED.
      // delete account.selected;

      try {
        await this.walletManager.addAccount(account, wallet, false); // Hold off indexing while we save all accounts.
      } catch (err) {
        this.snackBar.open(await this.translate.get('Account.ErrorWhileCreatingAccount').toPromise(), await this.translate.get('Account.ErrorWhileCreatingAccountAction').toPromise(), {
          duration: 6000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      }
    }

    // Get latest status on all networks immediately.
    // UPDATE: Status is now updated earlier than this and we don't want the UI to wait.
    // await this.networkStatus.updateAll(accounts);

    if (wallet.restored) {
      const msg = this.message.createMessage('index', { force: true }, 'background');
      this.message.send(msg);
    } else {
      const msg = this.message.createMessage('index', { force: false }, 'background');
      this.message.send(msg);
    }

    // this.refreshState();
    this.router.navigateByUrl('/dashboard');

    this.creating = false;
    // TODO: Refresh all instances when new accounts is created.
    // this.communication.sendToAll('account-created');
  }
}
