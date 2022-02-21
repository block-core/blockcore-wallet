import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { UIState } from '../services/ui-state.service';
import { CryptoService } from '../services/crypto.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunicationService } from '../services/communication.service';
import { AppManager } from '../../background/application-manager';
import { SecureStateService } from '../services/secure-state.service';
import * as secp from "@noble/secp256k1";
import { WalletManager } from '../../background/wallet-manager';
import { Action } from '../interfaces';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  problems: boolean;

  constructor(
    public uiState: UIState,
    // private appManager: ApplicationManagerService,
    private appManager: AppManager,
    public secure: SecureStateService,
    private router: Router,
    private walletManager: WalletManager,
    private communication: CommunicationService
  ) {
    this.uiState.title = 'Loading...';
    this.uiState.manifest = chrome.runtime.getManifest();
  }

  ngOnDestroy(): void {

  }

  reload() {
    window.location.href = 'index.html';
  }

  setAction(action: Action, broadcast = true) {
    this.communication.send('set-action', { action, broadcast });
  }

  async ngOnInit() {

    // When this happens, the appManager should already be initilized by the AppComponent.
    // All we want to do here, is check if there is any unlocked wallets or not, and then redirect
    // either to Home (to unlock) or Dashboard (unlocked).

    // if (this.walletManager.hasUnlockedWallets) {
    //   this.router.navigateByUrl('/dashboard');
    // } else {
    //   this.router.navigateByUrl('/home');
    // }

    // If there is any params, it means there might be an action triggered by protocol handlers. Parse the params and set action.
    if (this.uiState.params) {
      if (this.uiState.params.sid) {
        this.uiState.action = {
          action: 'sid',
          document: this.uiState.params.sid
        }

        setTimeout(() => {
          // Persist the action, but don't broadcast this change as we've already written local state.
          this.setAction(this.uiState.action, true);
        }, 0);
      }

      if (this.uiState.params.nostr) {
        this.uiState.action = {
          action: 'nostr',
          document: this.uiState.params.nostr
        }

        setTimeout(() => {
          // Persist the action, but don't broadcast this change as we've already written local state.
          this.setAction(this.uiState.action, true);
        }, 0);
      }
    }

    console.log('ACTION:', this.uiState.action);

    // If an action has been triggered, we'll always show action until user closes the action.
    if (this.uiState.action?.action && this.uiState.activeWallet && this.uiState.unlocked.indexOf(this.uiState.activeWallet.id) > -1) {
      // TODO: Add support for more actions.
      this.router.navigate(['action', this.uiState.action?.action]);
    } else {
      // If the state was changed and there is no wallets, send user to create wallet UI.
      if (!this.uiState.hasWallets) {
        this.router.navigateByUrl('/wallet/create');
      } else {


        // if (this.walletManager.hasUnlockedWallets) {
        //   this.router.navigateByUrl('/dashboard');
        // } else {
        //   this.router.navigateByUrl('/home');
        // }

        // If the active wallet is unlocked, we'll redirect accordingly.
        if (this.uiState.activeWallet && this.uiState.unlocked.indexOf(this.uiState.activeWallet.id) > -1) {

          // If user has zero accounts, we'll show the account select screen that will auto-create accounts the user chooses.
          if (this.uiState.hasAccounts) {
            this.router.navigateByUrl('/dashboard');
            //this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet.activeAccountIndex);
          } else {
            this.router.navigateByUrl('/account/select');
          }

        } else {
          // When the initial state is loaded and user has not unlocked any wallets, we'll show the unlock screen on home.
          console.log('LOADING REDIRECT TO HOME');
          this.router.navigateByUrl('/home');
        }
      }
    }

    // await this.appManager.initialize();

    // chrome.storage.onChanged.addListener((changes, area) => {
    //   console.log('chrome.storage.onChanged:changes:', changes);
    //   console.log('chrome.storage.onChanged:area:', area);
    // });

    // const storage = globalThis.chrome.storage as any;
    // await storage.session.set({ 'password': '123@!' });

    // await storage.session.set({
    //   ''
    // });


    // Each instance of extension need this listener when session is cleared.
    // storage.session.onChanged.addListener(function (changes: any, namespace: any) {
    //   console.log("change recived22222222!");
    //   console.log(changes);
    //   console.log(namespace);
    // });

    // storage.local.onChanged.addListener(function (changes: any, namespace: any) {
    //   console.log("change recived111111111!");
    //   console.log(changes);
    //   console.log(namespace);
    // });

    // await storage.session.set({ 'password': '123@!22' });

    // Make sure that the secure values are loaded.
    // await this.secure.load();

    // await this.appManager.initialize();
    // await this.appManager.initialize();

    // When the extension has been initialized, we'll send 'state' to background to get the current state. The UI will show loading
    // indicator until 'state-changed' is triggered.
    // chrome.tabs.query({
    //   active: true,
    //   lastFocusedWindow: true
    // }, (tabs) => {
    //   // debugger;
    //   var tab = tabs[0];
    //   // Provide the tab URL with the state query, because wallets and accounts is connected to domains.
    //   this.communication.send('state-load', { url: tab?.url });
    // });

    // If the state has not loaded or triggered after a timeout, display reload button / reset options.
    setTimeout(() => {
      this.problems = true;
    }, 5000);
  }
}
