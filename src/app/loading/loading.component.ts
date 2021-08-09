import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UIState } from '../services/ui-state.service';
import { CryptoService } from '../services/crypto.service';
import { Router } from '@angular/router';
import { State, Persisted } from '../interfaces';
import { CommunicationService } from '../services/communication.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  private sub: any;
  private sub2: any;
  // private sub2!: Subscription;

  constructor(
    public uiState: UIState,
    private crypto: CryptoService,
    private communication: CommunicationService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {
    this.uiState.title = 'Loading...';
    console.log('LOADING COMPONENT CONSTRUCTOR');
  }

  ngOnDestroy(): void {
    console.log('LOADING ON DESTROY!');

    if (this.sub) {
      this.communication.unlisten(this.sub);
    }

    // this.communication.unlisten(this.sub2);
  }

  // loadWallets() {
  //   if (!this.uiState.hasWallets) {
  //     this.router.navigateByUrl('/wallet/create');
  //   } else {
  //     // If the active wallet is unlocked, we'll redirect accordingly.
  //     if (this.uiState.activeWallet && this.uiState.unlocked.indexOf(this.uiState.activeWallet.id) > -1) {
  //       this.router.navigateByUrl('/account/view/' + this.uiState.persisted.activeWalletId);
  //     } else {
  //       this.router.navigateByUrl('/home');
  //     }
  //   }
  // }

  async ngOnInit() {

    // if (this.uiState.persisted.wallets.length > 0) {
    //   this.loadWallets();
    // }

    // Hook up to the persisted value and redirect when loaded.
    // this.sub2 = this.uiState.persisted$.subscribe((data) => {
    //   console.log('persisted$:', data);
    //   this.loadWallets();
    // });

    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, (tabs) => {
      var tab = tabs[0];
      // Provide the tab URL with the state query, because wallets and accounts is connected to domains.
      this.communication.send('state', { url: tab?.url });
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

    this.sub = this.communication.listen('state', () => {

      this.uiState.loading = false;

      console.log('SUBSCRIPTION IN LOADING!!!');

      // The primary listeners should be triggered first, so uiState should have been set by now.


      // Actions will override any other UI, but only if wallet is unlocked.
      if (this.uiState.action?.action && this.uiState.activeWallet && this.uiState.unlocked.indexOf(this.uiState.activeWallet.id) > -1) {
        // TODO: Add support for more actions.
        this.router.navigateByUrl('/action/sign');
      } else {
        if (!this.uiState.hasWallets) {
          this.router.navigateByUrl('/wallet/create');
        } else {
          // If the active wallet is unlocked, we'll redirect accordingly.
          if (this.uiState.activeWallet && this.uiState.unlocked.indexOf(this.uiState.activeWallet.id) > -1) {
            console.log('LOADING REDIRECT TO ACCOUNT');
            this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet.activeAccountIndex);
          } else {
            console.log('LOADING REDIRECT TO HOME');
            this.router.navigateByUrl('/home');
          }
        }

        // Select the previous selected account.
        //     // if (this.appState.hasWallets) {
        //     //   this.appState.activeWallet = this.appState.persisted.wallets[0];
        //     // }
        //     if (!this.uiState.hasWallets) {
        //       this.router.navigateByUrl('/wallet/create');
        //     }
        //     else {
        //       this.router.navigateByUrl('/home');
        //     }
      }

      // 

      // if (this.uiState.action) {
      //   this.router.navigateByUrl('/action/sign');
      // }
      // else {
      //   // Select the previous selected account.
      //   // if (this.appState.hasWallets) {
      //   //   this.appState.activeWallet = this.appState.persisted.wallets[0];
      //   // }
      //   if (!this.uiState.hasWallets) {
      //     this.router.navigateByUrl('/wallet/create');
      //   }
      //   else {
      //     this.router.navigateByUrl('/home');
      //   }
      // }
    });

    console.log('LOADING SUBSCRIPTION:', this.sub);

    // Perform the initial load of the application state.
    // var state = await this.appState.load();

    // if (state.data) {
    //   this.appState.persisted = state.data as Persisted;
    // }

    // // TODO: Remove this fake loader when closer to production.
    // setTimeout(() => {
    //   this.appState.loading = false;

    //   if (state.action) {
    //     this.router.navigateByUrl('/action/sign');
    //   }
    //   else {
    //     // Select the previous selected account.
    //     // if (this.appState.hasWallets) {
    //     //   this.appState.activeWallet = this.appState.persisted.wallets[0];
    //     // }
    //     if (!this.appState.hasWallets) {
    //       this.router.navigateByUrl('/wallet/create');
    //     }
    //     else {
    //       this.router.navigateByUrl('/home');
    //     }
    //   }

    // }, 500);
  }
}
