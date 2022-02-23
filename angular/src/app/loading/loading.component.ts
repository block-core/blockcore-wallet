import { Component, ChangeDetectorRef, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { UIState, CryptoService, CommunicationService, AppManager, SecureStateService, WalletManager, EnvironmentService, NetworksService, SettingsService, NetworkStatusService } from '../services';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import * as secp from "@noble/secp256k1";
import { Action } from '../interfaces';
import { TranslateService } from '@ngx-translate/core';
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
    public walletManager: WalletManager,
    private communication: CommunicationService,
    private renderer: Renderer2,
    public translate: TranslateService,
    private location: Location,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private env: EnvironmentService,
    private status: NetworkStatusService,
    private settings: SettingsService,
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
    // If the state has not loaded or triggered after a timeout, display reload button / reset options.
    setTimeout(() => {
      this.problems = true;
    }, 5000);

    document.title = this.env.instanceName;

    if (!this.uiState.initialized) {
      await this.appManager.initialize();
      await this.status.initialize();

      this.translate.addLangs(['en', 'no', 'fr']);
      this.translate.setDefaultLang('en');

      const browserLang = this.translate.getBrowserLang();
      this.translate.use(browserLang.match(/en|no/) ? browserLang : 'en');

      // this.uiState.persisted$.next(this.uiState.persisted);
      // this.uiState.activeWalletSubject.next(this.uiState.activeWallet);
      // this.uiState.activeAccountSubject.next(this.uiState.activeAccount);
    }

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

    // this.uiState.action = state.action;
    // this.uiState.persisted = state.persisted;
    // this.uiState.store = state.store;

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
    if (this.uiState.action?.action && this.walletManager.activeWallet && this.secure.unlocked(this.walletManager.activeWallet.id)) {
      // TODO: Add support for more actions.
      this.router.navigate(['action', this.uiState.action?.action]);
    } else {
      // If the state was changed and there is no wallets, send user to create wallet UI.
      if (!this.walletManager.hasWallets) {
        this.router.navigateByUrl('/wallet/create');
      } else {
        // If the active wallet is unlocked, we'll redirect accordingly.
        if (this.walletManager.activeWallet && this.secure.unlocked(this.walletManager.activeWallet.id)) {

          // If user has zero accounts, we'll show the account select screen that will auto-create accounts the user chooses.
          if (this.walletManager.hasAccounts) {
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

    // Loading has completed.
    this.uiState.loading = false;
  }
}
