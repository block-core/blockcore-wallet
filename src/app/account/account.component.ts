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
import { Transaction } from '../interfaces';

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
  public transactions: Transaction[];
  public networkStatus: any;

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
    }
  }

  scan(force: boolean = false) {
    this.loading = true;

    this.communication.send('account-scan', { force: force, account: this.uiState.activeAccount, wallet: this.uiState.activeWallet });
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

  openExplorer(transaction: Transaction) {
    const network = this.network.getNetwork(this.uiState.activeAccount.network, this.uiState.activeAccount.purpose);
    chrome.tabs.create({ url: `https://explorer.blockcore.net/${network.id}/explorer/transaction/${transaction.transactionHash}`, active: false });
  }

  async ngOnInit() {
    // Get a full list of transactions. We run filter at the end to remove empty entries.
    const transactions = this.uiState.activeAccount.state.receive.flatMap(item => item.transactions).filter((el) => el != null);

    // Sort the transactions by blockIndex, having the highest number first.
    const sortedTransactions = transactions.sort((a: any, b: any) => { if (a.blockIndex > b.blockIndex) return -1; return 0; });

    this.transactions = sortedTransactions;

    this.sub2 = this.communication.listen('account-scanned', async (data: { accountId: string }) => {
      this.loading = false;
    });

    // this.sub = this.communication.listen('address-generated', async (data: { address: string, receive: any[], change: any[] }) => {
    //   console.log('ADDRESS GENERATED!!');
    //   this.address = data.address;

    //   console.log('Full address list:');
    //   console.log(data);

    //   this.activities = [];

    //   // Perform a map operation on all receive addresses to extend the array with result from indexer results.
    //   data.receive.map(async item => {

    //     try {
    //       let result: any = await this.http.get(`http://localhost:9910/api/query/address/${item.address}`).toPromise();

    //       item.icon = 'history';
    //       item.title = 'Received: ' + result.totalReceived + ' to ' + result.address;

    //       let activity = {
    //         ...item,
    //         ...result
    //       };

    //       this.activities.push(activity);
    //       console.log('activity:', activity);

    //       // this.activities = [{
    //       //   icon: 'history',
    //       //   amount: 50,
    //       //   title: 'Received 50 STRAX',
    //       //   status: 'Confirming...',
    //       //   timestamp: new Date()
    //       // }, {
    //       //   icon: 'done',
    //       //   amount: 10,
    //       //   title: 'Sent 10 STRAX to XNfU57hAwQ1uWYRHjusas8MFCUQetuuX6o',
    //       //   status: 'Success',
    //       //   timestamp: new Date()
    //       // }]

    //     }
    //     catch (error: any) {
    //       console.log('oops', error);

    //       if (error.error?.title) {
    //         this.snackBar.open('Error: ' + error.error.title, 'Hide', {
    //           duration: 8000,
    //           horizontalPosition: 'center',
    //           verticalPosition: 'bottom',
    //         });
    //       } else {
    //         this.snackBar.open('Error: ' + error.message, 'Hide', {
    //           duration: 8000,
    //           horizontalPosition: 'center',
    //           verticalPosition: 'bottom',
    //         });
    //       }
    //     }

    //     // let result = await this.http.get(`http://localhost:9910/api/query/address/${item.address}`).subscribe(result => {
    //     // }, error => {

    //     // });
    //   });

    //   const requests = <any>[];
    //   let requests$: Observable<any[]>;

    //   //   this.http.get('https://jsonplaceholder.typicode.com/posts/1')
    //   // .pipe(mergeMap((res: any)=> this.httpClient
    //   //     .get('https://jsonplaceholder.typicode.com/users/'+res.userId)))
    //   // .subscribe((authorDetails: any)=>{
    //   //     console.log(authorDetails)
    //   // })

    //   // console.log(requests$);

    //   // requests$.subscribe((data: any) => {
    //   //   console.log(data);
    //   // });

    //   // Perform all the http requests that has been added to requests queue:
    //   // Promise.all(requests);

    // });

    // this.sub = this.communication.listen('active-account-changed', (data: any) => {
    //   // If we are currently viewing an account and the user changes, we'll refresh this view.
    //   if (this.previousIndex != data.index) {
    //     console.log('active-account-changed!!!! DIFFERENT, WILL NAVIGATE!');
    //     this.router.navigate(['account', 'view', data.index]);
    //   }
    // });
  }
}
