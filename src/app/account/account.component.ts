import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../services/crypto.service';
import { UIState } from '../services/ui-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrchestratorService } from '../services/orchestrator.service';
import { CommunicationService } from '../services/communication.service';
import { NETWORK_IDENTITY, NETWORK_NOSTR } from '../shared/constants';
import { concat, Observable, concatMap } from 'rxjs';
import { request } from 'http';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  wallet: any;
  account!: any;
  address!: string;
  // sub: any;
  previousIndex!: number;
  sub: any;
  loading = true;

  activities: any[] = [];

  constructor(
    private http: HttpClient,
    public uiState: UIState,
    private crypto: CryptoService,
    private router: Router,
    private manager: OrchestratorService,
    private communication: CommunicationService,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cd: ChangeDetectorRef) {

    this.uiState.title = 'Account...';
    this.uiState.showBackButton = true;

    setTimeout(() => {
      this.loading = false;
    }, 1500);

    // Whenever the account changes, re-generate the address.
    this.uiState.activeAccount$.subscribe(() => {
      this.generateAddress();
    });

    if (!this.uiState.hasAccounts) {
      this.router.navigateByUrl('/account/create');
    }


    this.activatedRoute.paramMap.subscribe(async params => {
      debugger;
      console.log('PARAMS:', params);
      const index: any = params.get('index');
      // console.log('Account Index:', Number(index));

      console.log('Index to view:', index);

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

      // this.generateAddress();

      // this.uiState.persisted.activeAccountIndex = Number(index);
      // Persist when changing accounts.
      // this.uiState.save();
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.communication.unlisten(this.sub);
    }
  }

  generateAddress() {
    console.log('GENERATE address!!!!');
    console.log(this.uiState.activeAccount);

    debugger;
    // this.communication.send('address-generate', { index: 0 });
  }

  async ngOnInit() {
    this.sub = this.communication.listen('address-generated', async (data: { address: string, receive: any[], change: any[] }) => {
      console.log('ADDRESS GENERATED!!');
      this.address = data.address;

      console.log('Full address list:');
      console.log(data);

      this.activities = [];

      // Perform a map operation on all receive addresses to extend the array with result from indexer results.
      data.receive.map(async item => {

        try {
          let result: any = await this.http.get(`http://localhost:9910/api/query/address/${item.address}`).toPromise();

          item.icon = 'history';
          item.title = 'Received: ' + result.totalReceived + ' to ' + result.address;

          let activity = {
            ...item,
            ...result
          };

          this.activities.push(activity);
          console.log('activity:', activity);

          // this.activities = [{
          //   icon: 'history',
          //   amount: 50,
          //   title: 'Received 50 STRAX',
          //   status: 'Confirming...',
          //   timestamp: new Date()
          // }, {
          //   icon: 'done',
          //   amount: 10,
          //   title: 'Sent 10 STRAX to XNfU57hAwQ1uWYRHjusas8MFCUQetuuX6o',
          //   status: 'Success',
          //   timestamp: new Date()
          // }]

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

        // let result = await this.http.get(`http://localhost:9910/api/query/address/${item.address}`).subscribe(result => {
        // }, error => {

        // });
      });

      const requests = <any>[];
      let requests$: Observable<any[]>;

      //   this.http.get('https://jsonplaceholder.typicode.com/posts/1')
      // .pipe(mergeMap((res: any)=> this.httpClient
      //     .get('https://jsonplaceholder.typicode.com/users/'+res.userId)))
      // .subscribe((authorDetails: any)=>{
      //     console.log(authorDetails)
      // })




      // console.log(requests$);

      // requests$.subscribe((data: any) => {
      //   console.log(data);
      // });

      // Perform all the http requests that has been added to requests queue:
      // Promise.all(requests);

    });

    // this.generateAddress();

    // this.sub = this.communication.listen('active-account-changed', (data: any) => {
    //   // If we are currently viewing an account and the user changes, we'll refresh this view.
    //   if (this.previousIndex != data.index) {
    //     console.log('active-account-changed!!!! DIFFERENT, WILL NAVIGATE!');
    //     this.router.navigate(['account', 'view', data.index]);
    //   }
    // });
  }
}
