import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../services/crypto.service';
import { UIState } from '../services/ui-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrchestratorService } from '../services/orchestrator.service';
import { CommunicationService } from '../services/communication.service';
import { NETWORK_IDENTITY, NETWORK_NOSTR } from '../shared/constants';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NetworksService } from '../services/networks.service';
import { Transaction, TransactionHistory } from '../interfaces';

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
  loading = false;
  activities: any[] = [];
  public transactions: TransactionHistory[];
  public networkStatus: any;
  private scanTimer: any;
  addresses: string[];

  constructor(
    private http: HttpClient,
    public uiState: UIState,
    private crypto: CryptoService,
    private router: Router,
    private network: NetworksService,
    private manager: OrchestratorService,
    private communication: CommunicationService,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cd: ChangeDetectorRef) {

    this.uiState.title = 'Account...';
    this.uiState.showBackButton = true;

    if (!this.uiState.hasAccounts) {
      this.router.navigateByUrl('/account/create');
    }

    this.activatedRoute.paramMap.subscribe(async params => {
      console.log('PARAMS:', params);
      const index: any = params.get('index');

      if (!this.uiState.activeWallet) {
        return;
      }

      this.manager.setActiveAccountId(index);
      this.uiState.title = this.uiState.activeAccount?.name || '';
      this.previousIndex = index;

      if (this.uiState.activeAccount?.network == NETWORK_IDENTITY) {
        this.router.navigate(['account', 'view', 'identity', index]);
      } else if (this.uiState.activeAccount?.network == NETWORK_NOSTR) {
        this.router.navigate(['account', 'view', 'nostr', index]);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.communication.unlisten(this.sub);
      this.sub = null;
    }

    if (this.sub2) {
      console.log('UNSUBSCRIBE!!!');
      this.sub2.unsubscribe();
      this.sub2 = null;
    }

    clearInterval(this.scanTimer);
  }

  scan(force: boolean = false) {
    this.loading = true;
    this.communication.send('account-scan', { force: force, accountId: this.uiState.activeAccount.identifier, walletId: this.uiState.activeWallet.id });
  }

  async toggleNetwork() {
    if (!this.networkStatus) {
      try {
        const network = this.network.getNetwork(this.uiState.activeAccount.network, this.uiState.activeAccount.purpose);
        const indexerUrl = this.uiState.persisted.settings.indexer.replace('{id}', network.id.toLowerCase());
        let result: any = await this.http.get(`${indexerUrl}/api/stats/info`).toPromise();
        this.networkStatus = result;
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

  private refreshTransactionHistory() {
    const account = this.uiState.activeAccount;

    // Get a full list of transactions. We run filter at the end to remove empty entries.
    const transactions = account.state.receive.flatMap(item => item.transactions).filter((el) => el != null);

    // Sort the transactions by blockIndex, having the highest number first.
    const sortedTransactions = transactions.sort((a: any, b: any) => { if (a.blockIndex > b.blockIndex) return -1; return 0; });

    // Create an array with all addresses that exists.
    this.addresses = [...account.state.receive.map(r => r.address), ...account.state.change.map(c => c.address)];

    console.log(this.addresses);

    sortedTransactions.map(t => {
      const tx = t as TransactionHistory;

      const externalOutputs = t.details.outputs.filter(o => this.addresses.indexOf(o.address) === -1);
      const internalOutputs = t.details.outputs.filter(o => this.addresses.indexOf(o.address) > -1);
      const externalInputs = t.details.inputs.filter(o => this.addresses.indexOf(o.inputAddress) === -1);
      const internalInputs = t.details.inputs.filter(o => this.addresses.indexOf(o.inputAddress) > -1);

      // Check if there is any external outputs or inputs. If not, user is sending to themselves:
      if (externalOutputs.length == 0 && externalInputs.length == 0) {
        tx.description = 'Consolidated';
        tx.calculatedAddress = internalOutputs.map(o => o.address).join('<br>');
      } else {

        if (t.entryType == 'send') {
          const amount = externalOutputs.map(x => x.balance).reduce((x: any, y: any) => x + y);
          tx.calculatedValue = amount;
          tx.calculatedAddress = externalOutputs.map(o => o.address).join('<br>');
        }

        if (t.entryType == 'receive') {
          const receivedAmount = internalOutputs.map(x => x.balance).reduce((x: any, y: any) => x + y);
          tx.calculatedAddress = internalOutputs.map(o => o.address).join('<br>');
          tx.calculatedValue = receivedAmount;
        }
      }

      return tx;
    });

    // Remove duplicates based upon transactionhex as it only means that there was multiple inputs in our history
    // and that results in duplicate entries. The unique filtering of transactions is a bit naïve, and if there is 
    // different between "receive" and "send" on the same transaction entry, then either one will show.
    const filteredTransactions = sortedTransactions.filter((value, index, self) => self.map(x => x.transactionHash).indexOf(value.transactionHash) == index);

    console.log(sortedTransactions);
    console.log(filteredTransactions);

    this.transactions = filteredTransactions as TransactionHistory[];
  }

  async ngOnInit() {
    // This will be triggered when user navigates into the account, since active account state is changed.
    this.sub2 = this.uiState.persisted$.subscribe(() => {
      console.log('NO!!!!!!!!');
      this.refreshTransactionHistory();
    });

    this.sub = this.communication.listen('account-scanned', async (data: { accountId: string }) => {
      this.loading = false;
    });

    this.scanTimer = setInterval(() => {
      this.scan();
    }, 30000);
  }
}
