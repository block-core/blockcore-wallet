import { Component, ChangeDetectorRef, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { UIState } from '../services/ui-state.service';
import { CryptoService } from '../services/crypto.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { CommunicationService } from '../services/communication.service';
import { AppManager } from '../../background/application-manager';
import { SecureStateService } from '../services/secure-state.service';
import * as secp from "@noble/secp256k1";
import { WalletManager } from '../../background/wallet-manager';
import { Action } from '../interfaces';
import { TranslateService } from '@ngx-translate/core';
import { OrchestratorService } from '../services/orchestrator.service';
import { EnvironmentService } from '../services/environment.service';
import { NetworksService } from '../services/networks.service';
import { Location } from '@angular/common'

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
    private communication: CommunicationService,
    private renderer: Renderer2,
    public translate: TranslateService,
    private manager: OrchestratorService,
    private location: Location,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private env: EnvironmentService,
    public networkService: NetworksService
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

  instanceName: string;

  async ngOnInit() {


    console.log('NGONINIT: APP COMPONENT');

    await this.appManager.initialize();

    await this.manager.initialize();

    console.log('INITILIZED DONE...');

    this.translate.addLangs(['en', 'no', 'fr']);
    this.translate.setDefaultLang('en');

    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang.match(/en|no/) ? browserLang : 'en');

    document.title = this.env.instanceName;

    const queryParam = globalThis.location.search;
    console.log('queryParam:', queryParam);

    // TODO: IT IS NOT POSSIBLE TO "EXIT" ACTIONS THAT ARE TRIGGERED WITH QUERY PARAMS.
    // FIX THIS ... attempted to check previous, but that does not work...
    if (queryParam) {
      const param = Object.fromEntries(new URLSearchParams(queryParam)) as any;

      // Only when the param is different than before, will we re-trigger the action.
      if (JSON.stringify(param) != JSON.stringify(this.uiState.params)) {
        this.uiState.params = param;
      } else {
        console.log('PARAMS IS NOT DIFFERENT!! CONTINUE AS BEFORE!');
      }
    }

    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        // this.uiState.showBackButton = false;
        // this.uiState.title = '';
        this.uiState.active();
      }
    });

    this.uiState.persisted$.subscribe(() => {
      if (this.uiState.persisted?.settings.theme === 'light') {
        this.renderer.removeClass(document.body, 'dark-theme');
      } else {
        this.renderer.addClass(document.body, 'dark-theme');
      }

      if (this.uiState.persisted.settings.language) {
        this.translate.use(this.uiState.persisted.settings.language);
      }

      // if (this.uiState.persisted?.settings.theme === 'light') {
      //   this.renderer.setAttribute(document.body, 'color', 'warn');
      // } else {
      //   this.renderer.addClass(document.body, 'dark-theme');
      // }

    });


















    console.log('NGONINIT: LOADING COMPONENT');

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
    console.log('STATE:', this.uiState);

    // If an action has been triggered, we'll always show action until user closes the action.
    if (this.uiState.action?.action && this.uiState.activeWallet && this.secure.unlocked(this.uiState.activeWallet.id)) {
      // TODO: Add support for more actions.
      this.router.navigate(['action', this.uiState.action?.action]);
    } else {
      // If the state was changed and there is no wallets, send user to create wallet UI.
      if (!this.uiState.hasWallets) {
        console.log('HAS NO WALLETS!!!!');
        console.log(this.uiState);
        this.router.navigateByUrl('/wallet/create');
      } else {
        // if (this.walletManager.hasUnlockedWallets) {
        //   this.router.navigateByUrl('/dashboard');
        // } else {
        //   this.router.navigateByUrl('/home');
        // }

        // If the active wallet is unlocked, we'll redirect accordingly.
        if (this.uiState.activeWallet && this.secure.unlocked(this.uiState.activeWallet.id)) {

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
