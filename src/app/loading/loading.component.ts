import { Component,  ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { UIState } from '../services/ui-state.service';
import { CryptoService } from '../services/crypto.service';
import { Router } from '@angular/router';
import { CommunicationService } from '../services/communication.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  private sub: any;
  private sub2: any;

  constructor(
    public uiState: UIState,
    private crypto: CryptoService,
    private communication: CommunicationService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {
    this.uiState.title = 'Loading...';
    this.uiState.manifest = chrome.runtime.getManifest();
  }

  ngOnDestroy(): void {
    // if (this.sub) {
    //   this.communication.unlisten(this.sub);
    // }
  }

  async ngOnInit() {

    // if (this.uiState.persisted.wallets.length > 0) {
    //   this.loadWallets();
    // }

    // Hook up to the persisted value and redirect when loaded.
    // this.sub2 = this.uiState.persisted$.subscribe((data) => {
    //   console.log('persisted$:', data);
    //   this.loadWallets();
    // });


    // When the extension has been initialized, we'll send 'state' to background to get the current state. The UI will show loading
    // indicator until 'state-changed' is triggered.
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, (tabs) => {
      debugger;
      var tab = tabs[0];
      // Provide the tab URL with the state query, because wallets and accounts is connected to domains.
      this.communication.send('state-load', { url: tab?.url });
    });


    // Make sure we have initialized state at least once.
    // Should this be observable or something, so we can subscribe?
    // if (this.uiState.initialized) {
    //   // First check if there is any action triggered, then show the action UI.
    //   if (this.uiState.action) {
    //     this.router.navigateByUrl('/action/sign');
    //   } else {
    //     if (!this.uiState.hasWallets) {
    //       this.router.navigateByUrl('/wallet/create');
    //     } else if (this.uiState.unlocked) {
    //       // If there is any wallet unlocked, we'll show the last active wallet:
    //       this.router.navigateByUrl('/account/view/' + this.uiState.persisted.activeWalletId);
    //     } else {
    //       this.router.navigateByUrl('/home');
    //     }
    //   }
    // }
    // else {
    //   console.log('NOT INITIALIZE!');
    // }

    // this.communication.listen('state', (state: State) => {

    //   console.log('state', state);

    //   this.uiState.persisted = state.persisted;
    //   this.uiState.unlocked = state.unlocked;
    // });



    // setTimeout(() => {
    //   this.communication.send('state',);
    // }, 2000);

    // Load the application state, which is individual UI instance data.
    // var state = await this.uiState.load();

    this.uiState.activeWallet$.toPromise().then((data) => {
      debugger;
      console.log(data);
    });

    this.uiState.activeAccount$.toPromise().then((data) => {
      debugger;
      console.log(data);
    });
    

    // // SHOULD WE LISTEN TO STATE-CHANGED, OR REALLY BE LOOKING AT THE WALLET AND ACCOUNT?!
    // this.sub = this.communication.listen('state-changed', () => {
    //   debugger;

    //   this.uiState.loading = false;

    //   console.log('SUBSCRIPTION IN LOADING!!!');

    //   // The primary listeners should be triggered first, so uiState should have been set by now.

    //   // Actions will override any other UI, but only if wallet is unlocked.
    //   if (this.uiState.action?.action && this.uiState.activeWallet && this.uiState.unlocked.indexOf(this.uiState.activeWallet.id) > -1) {
    //     // TODO: Add support for more actions.
    //     this.router.navigate(['action', this.uiState.action?.action]);
    //   } else {
    //     if (!this.uiState.hasWallets) {
    //       this.router.navigateByUrl('/wallet/create');
    //     } else {

    //       debugger;

    //       // If the active wallet is unlocked, we'll redirect accordingly.
    //       if (this.uiState.activeWallet && this.uiState.unlocked.indexOf(this.uiState.activeWallet.id) > -1) {
    //         console.log('LOADING REDIRECT TO ACCOUNT');
    //         this.router.navigateByUrl('/dashboard');
    //         //this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet.activeAccountIndex);
    //       } else {
    //         console.log('LOADING REDIRECT TO HOME');
    //         this.router.navigateByUrl('/home');
    //       }
    //     }
    //   }
    // });
  }
}
