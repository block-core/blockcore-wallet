import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UIState } from '../services/ui-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrchestratorService } from '../services/orchestrator.service';
import { CommunicationService } from '../services/communication.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NetworksService } from '../services/networks.service';
import { NetworkStatus, TransactionHistory } from '../interfaces';
import { NetworkStatusService } from '../services/network-status.service';
import { SettingsService } from '../services/settings.service';

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
  loading = false;
  activities: any[] = [];
  public transactions: TransactionHistory[];
  public networkStatus: any;
  private scanTimer: any;
  addresses: string[];
  currentNetworkStatus: NetworkStatus;

  constructor(
    public uiState: UIState,
    public settings: SettingsService,
    private http: HttpClient,
    private router: Router,
    private network: NetworksService,
    private networkStatusService: NetworkStatusService,
    private manager: OrchestratorService,
    private communication: CommunicationService,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar) {

    this.uiState.title = '';
    this.uiState.showBackButton = true;

    if (!this.uiState.hasAccounts) {
      this.router.navigateByUrl('/account/create');
    }

    this.activatedRoute.paramMap.subscribe(async params => {
      console.log('PARAMS:', params);
      const accountIdentifier: any = params.get('index');

      if (!this.uiState.activeWallet) {
        return;
      }

      // this.manager.setActiveAccountId(index);
      this.manager.setActiveAccountId(accountIdentifier);
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

    if (this.sub3) {
      this.communication.unlisten(this.sub3);
      this.sub3 = null;
    }
  }

  scan(force: boolean = false) {
    this.loading = true;
    this.communication.send('account-scan', { force: force, accountId: this.uiState.activeAccount.identifier, walletId: this.uiState.activeWallet.id });

    // Update the network status on every scan.
    this.currentNetworkStatus = this.networkStatusService.get(this.uiState.activeAccount.networkType);
  }

  async toggleNetwork() {
    if (!this.networkStatus) {
      try {
        const network = this.network.getNetwork(this.uiState.activeAccount.networkType);
        const indexerUrl = this.settings.values.indexer.replace('{id}', network.id.toLowerCase());
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
    const transactionsReceive = account.state.receive.flatMap(item => item.transactions).filter((el) => el != null);
    const transactionsChange = account.state.change.flatMap(item => item.transactions).filter((el) => el != null);

    // console.log('VERIFY TRANSACTIONS1:');
    // console.log(transactionsReceive);

    // console.log('VERIFY TRANSACTIONS2:');
    // console.log(transactionsChange);

    // Sort the transactions by blockIndex, having the highest number first.
    // const sortedReceiveTransactions = transactionsReceive.sort((a: any, b: any) => { if (a.blockIndex > b.blockIndex) return -1; return 0; });
    // const sortedChangeTransactions = transactionsChange.sort((a: any, b: any) => { if (a.blockIndex > b.blockIndex) return -1; return 0; });

    // console.log('VERIFY TRANSACTIONS3:');
    // console.log(sortedReceiveTransactions);

    // console.log('VERIFY TRANSACTIONS4:');
    // console.log(sortedChangeTransactions);

    // Create an array with all addresses that exists.
    this.addresses = [...account.state.receive.map(r => r.address), ...account.state.change.map(c => c.address)];

    // console.log('VERIFY TRANSACTIONS5:');
    // console.log(this.addresses);

    transactionsReceive.map(t => {
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

    transactionsChange.map(t => {
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

    // console.log('VERIFY TRANSACTIONS6:');
    // console.log(sortedReceiveTransactions);

    // console.log('VERIFY TRANSACTIONS7:');
    // console.log(sortedChangeTransactions);

    const allTransactions = [...transactionsReceive, ...transactionsChange] as TransactionHistory[];
    const sortedAllTransactions = allTransactions.sort((a: any, b: any) => { if (a.blockIndex > b.blockIndex) return -1; return 0; });

    this.transactions = sortedAllTransactions;

    console.log('this.transactions');
    console.log(this.transactions);

    // Sort the transactions by blockIndex, having the highest number first.
    // const sortedReceiveTransactions = transactionsReceive.sort((a: any, b: any) => { if (a.blockIndex > b.blockIndex) return -1; return 0; });
    // const sortedChangeTransactions = transactionsChange.sort((a: any, b: any) => { if (a.blockIndex > b.blockIndex) return -1; return 0; });

    // Remove duplicates based upon transactionhex as it only means that there was multiple inputs in our history
    // and that results in duplicate entries. The unique filtering of transactions is a bit naïve, and if there is 
    // different between "receive" and "send" on the same transaction entry, then either one will show.
    // const filteredTransactions = sortedReceiveTransactions.filter((value, index, self) => self.map(x => x.transactionHash).indexOf(value.transactionHash) == index);

    // console.log('VERIFY TRANSACTIONS7:');
    // console.log(filteredTransactions);

    // this.transactions = filteredTransactions as TransactionHistory[];
  }

  updateNetworkStatus() {
    this.currentNetworkStatus = this.networkStatusService.get(this.uiState.activeAccount.networkType);
  }

  async ngOnInit() {
    this.updateNetworkStatus();

    // This will be triggered when user navigates into the account, since active account state is changed.
    this.sub2 = this.uiState.persisted$.subscribe(() => {
      console.log('NO!!!!!!!!');
      this.refreshTransactionHistory();
    });

    this.sub = this.communication.listen('account-scanned', async (data: { accountId: string }) => {
      this.loading = false;
    });

    this.sub3 = this.communication.listen('active-account-changed', async (data: { walletId: string, accountId: string }) => {
      this.updateNetworkStatus();

      // When the active account has changed, let's update the title:
      // We cannot set title yet, we must wait for callback for changing account...
      this.uiState.title = this.uiState.activeAccount?.name || '';

      // if (this.uiState.activeAccount?.network == NETWORK_IDENTITY) {
      //   this.router.navigate(['account', 'view', 'identity', accountIdentifier]);
      // } else if (this.uiState.activeAccount?.network == NETWORK_NOSTR) {
      //   this.router.navigate(['account', 'view', 'nostr', accountIdentifier]);
      // }
    });

    this.scanTimer = setInterval(() => {
      this.scan();
    }, 30000);
  }
}
