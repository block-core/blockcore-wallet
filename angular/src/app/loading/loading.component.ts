import { Component, ChangeDetectorRef, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
import { UIState, CommunicationService, AppManager, SecureStateService, WalletManager, EnvironmentService, NetworksService, SettingsService, NetworkStatusService, LoggerService } from '../services';
import { ActivatedRoute, Data, Params, Router } from '@angular/router';
import { Action } from '../../shared/interfaces';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT, Location } from '@angular/common';
import { combineLatest } from 'rxjs';
import { RuntimeService } from '../services/runtime.service';
import { OrchestratorService } from '../services/orchestrator.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css'],
})
export class LoadingComponent implements OnInit, OnDestroy {
  problems: boolean;
  sub: any;

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
    private logger: LoggerService,
    private status: NetworkStatusService,
    private settings: SettingsService,
    public networkService: NetworksService,
    private orchestrator: OrchestratorService,
    private runtime: RuntimeService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.uiState.title = 'Loading...';
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  reload() {
    window.location.href = 'index.html';
  }

  instanceName: string;

  async ngOnInit() {
    this.sub = combineLatest([this.route.params, this.route.data], (params: Params, data: Data) => ({
      params,
      data,
    })).subscribe((res: { params: Params; data: Data }) => {
      const { params, data } = res;

      // NOTE: This logic is executed every time / is navigated to.
      if (this.document.body.classList.contains('popup-mode') || this.document.body.classList.contains('full-mode')) {
        return;
      }

      // If it's verified that we're in a popup.
      if (data['popup'] === true) {
        this.document.body.classList.add('popup-mode');
      } else {
        this.document.body.classList.add('full-mode');
      }
    });

    // If the state has not loaded or triggered after a timeout, display reload button / reset options.
    setTimeout(() => {
      this.problems = true;
    }, 5000);

    document.title = this.env.instanceName;

    if (!this.uiState.initialized) {
      // When not running in extension context, we will initialize the frontend orchestrator.
      if (!this.runtime.isExtension) {
        // Run this before app manager initialize, because it will add listeners for communication messages
        // triggered by the app manager initialize.
        this.orchestrator.initialize();
      }

      await this.appManager.initialize();
      await this.status.initialize();

      this.translate.addLangs(['en', 'no', 'fr']);
      this.translate.setDefaultLang('en');

      // TODO: Backwards compatible fix. Remove on release.
      if (!this.settings.values.server) {
        this.settings.values.server = 'group1';
      }

      if (this.settings.values.language) {
        this.translate.use(this.settings.values.language);
      } else {
        // This will never happen, because the default settings always goes to english.
        // Left here because we should consider allowing user to pick language potentially
        // the first time usage, or read from browser on first usage?
        const browserLang = this.translate.getBrowserLang();
        this.translate.use(browserLang.match(/en|no/) ? browserLang : 'en');
      }

      if (this.settings.values.theme === 'light') {
        this.renderer.removeClass(document.body, 'dark-theme');
      } else {
        this.renderer.addClass(document.body, 'dark-theme');
      }

      this.uiState.initialized = true;
    }

    // const queryParam = globalThis.location.search;

    // TODO: IT IS NOT POSSIBLE TO "EXIT" ACTIONS THAT ARE TRIGGERED WITH QUERY PARAMS.
    // FIX THIS ... attempted to check previous, but that does not work...
    // if (queryParam) {
    //   const param = Object.fromEntries(new URLSearchParams(queryParam)) as any;

    //   console.log('THERE ARE PARAMS', param);

    //   // Only when the param is different than before, will we re-trigger the action.
    //   if (JSON.stringify(param) != JSON.stringify(this.uiState.params)) {
    //     this.uiState.params = param;
    //   } else {
    //     this.logger.debug('PARAMS IS NOT DIFFERENT!! CONTINUE AS BEFORE!');
    //   }
    // }

    // If there is any params, it means there might be an action triggered by protocol handlers. Parse the params and set action.
    if (this.uiState.params) {
      if (this.uiState.params.sid) {
        this.uiState.action = {
          action: 'sid',
          document: this.uiState.params.sid,
          app: this.uiState.params.app,
          id: this.uiState.params.id,
          args: this.uiState.params.args,
        };
      } else if (this.uiState.params.nostr) {
        this.uiState.action = {
          action: 'nostr',
          document: this.uiState.params.nostr,
          app: this.uiState.params.app,
          id: this.uiState.params.id,
          args: this.uiState.params.args,
        };
      } else if (this.uiState.params.action) {
        this.uiState.action = {
          action: this.uiState.params.action,
          id: this.uiState.params.id,
          args: this.uiState.params.args,
          app: this.uiState.params.app,
        };
      }
    }

    this.logger.debug('LOADING ACTION:', this.uiState.action);

    // Activate a wallet if not active.
    if (this.walletManager.hasWallets && !this.walletManager.activeWallet && this.uiState.persisted.previousWalletId) {
      await this.walletManager.setActiveWallet(this.uiState.persisted.previousWalletId);
      await this.walletManager.setActiveAccount(this.uiState.persisted.previousAccountId);
    }

    // If an action has been triggered, we'll always show action until user closes the action.
    if (this.uiState.action?.action && this.walletManager.activeWallet && this.secure.unlocked(this.walletManager.activeWallet.id)) {
      console.log('REDIRECT TO ACTION!!!!', this.uiState.action?.action);
      // TODO: Add support for more actions.

      // TODO: Add improved verification of action. We don't want messages to be able to route users anywhere other than known actions.
      if (this.uiState.action?.action.indexOf('/') > -1 || this.uiState.action?.action.indexOf('\\') > -1) {
        throw new TypeError('Illegal characters in action');
      }

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
          } else {
            this.router.navigateByUrl('/account/select');
          }
        } else {
          // When the initial state is loaded and user has not unlocked any wallets, we'll show the unlock screen on home.
          this.router.navigateByUrl('/home');

          // console.log('USING PREVIOUS ACTIVE WALLET!!');
          // // No active wallet... Set the previous active wallet.
          // await this.walletManager.setActiveWallet(this.uiState.persisted.previousWalletId);

          // // If the previous wallet ID is actually unlocked already, which can happen when a new
          // // instance of the extension is opened, then send user directly to dashboard.
          // if (this.secure.unlocked(this.uiState.persisted.previousWalletId)) {
          //   this.router.navigateByUrl('/dashboard');
          // } else {
          //   // When the initial state is loaded and user has not unlocked any wallets, we'll show the unlock screen on home.
          //   this.router.navigateByUrl('/home');
          // }
        }
      }
    }

    // Loading has completed.
    this.uiState.loading = false;
  }
}
