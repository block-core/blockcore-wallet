import { Component, ChangeDetectorRef, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
import { UIState, CommunicationService, AppManager, SecureStateService, WalletManager, EnvironmentService, NetworksService, SettingsService, NetworkStatusService, LoggerService } from '../services';
import { ActivatedRoute, Data, Params, Router } from '@angular/router';
import { ActionUrlParameters } from '../../shared/interfaces';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT, Location } from '@angular/common';
import { combineLatest } from 'rxjs';
import { RuntimeService } from '../../shared/runtime.service';
import { OrchestratorService } from '../services/orchestrator.service';
import { PaymentRequest } from 'src/shared/payment';

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
    private paymentRequest: PaymentRequest,
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
  ) { }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  reload() {
    window.location.href = 'index.html';
  }

  hasJsonStructure(str: any) {
    if (typeof str !== 'string') return false;
    try {
      const result = JSON.parse(str);
      const type = Object.prototype.toString.call(result);
      return type === '[object Object]'
        || type === '[object Array]';
    } catch (err) {
      return false;
    }
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
      } else if (data['side'] === true) {
        this.document.body.classList.add('full-mode');
        this.document.body.classList.add('side-mode');
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

      this.translate.addLangs(['ar', 'el', 'en', 'fa', 'fr', 'he', 'no', 'ru']);
      this.translate.setDefaultLang('en');

      // TODO: Backwards compatible fix. Remove on release.
      if (!this.settings.values.server) {
        this.settings.values.server = 'group1';
      }

      if (this.settings.values.language) {
        this.settings.setLanguage(this.settings.values.language);
      } else {
        // This will never happen, because the default settings always goes to english.
        // Left here because we should consider allowing user to pick language potentially
        // the first time usage, or read from browser on first usage?
        const browserLang = this.translate.getBrowserLang();
        this.settings.setLanguage(browserLang.match(/en|no/) ? browserLang : 'en');
      }

      if (this.settings.values.theme === 'light') {
        this.renderer.removeClass(document.body, 'dark-theme');
      } else {
        this.renderer.addClass(document.body, 'dark-theme');
      }

      this.uiState.initialized = true;
    }

    // If there is any query parameters, it means there might be an action triggered by protocol handlers. Parse the params and set action.
    if (this.uiState.params) {
      const parameters: ActionUrlParameters = this.uiState.params;

      let verify = undefined;

      // All parameters are always string, so validate the verify here:
      if (parameters.verify === 'true') {
        verify = true;
      } else if (parameters.verify === 'false') {
        verify = false;
      }

      if (parameters.action) {
        // Transform the content to be displayed to user.
        const parsedContent = this.hasJsonStructure(parameters.content) ? JSON.parse(parameters.content) : parameters.content;

        this.uiState.action = {
          action: parameters.action,
          id: parameters.id,
          content: parsedContent,
          params: JSON.parse(parameters.params), // Transform the params from string to object here after we've received it through the query string.
          app: parameters.app,
          verify: verify,
        };
      }

      // Parse the payment request and keep it in the state until wallet is ready:
      if (parameters.pay) {
        this.uiState.payment = this.paymentRequest.decode(this.paymentRequest.removeHandler(parameters.pay));
        this.uiState.isPaymentAction = false;
        console.log('Payment request:', this.uiState.payment);
      } else if (this.uiState.action?.action == 'payment') {
        const param = this.uiState.action.params[0];
        this.uiState.payment = this.paymentRequest.transform(param);
        this.uiState.isPaymentAction = true;

        // Reset the action as payment is not a normal action.
        this.uiState.action = null;
      }
    }

    // If the loading was triggered by wallet.unlock action, make sure we first change the active wallet before we show
    // the unlock screen.
    if (this.uiState.action?.action === 'wallet.unlock') {
      const walletId = this.uiState.action.params[0].walletId;
      await this.walletManager.setActiveWallet(walletId);
    } else if (this.walletManager.hasWallets && !this.walletManager.activeWallet && this.uiState.persisted.previousWalletId) {
      // Activate a wallet if not active.
      await this.walletManager.setActiveWallet(this.uiState.persisted.previousWalletId);
      await this.walletManager.setActiveAccount(this.uiState.persisted.previousAccountId);
    }

    // If an action has been triggered, we'll always show action until user closes the action.
    if (this.uiState.action?.action && this.walletManager.activeWallet && this.secure.unlocked(this.walletManager.activeWallet.id)) {
      // TODO: Add improved verification of action. We don't want messages to be able to route users anywhere other than known actions.
      if (this.uiState.action.action.indexOf('/') > -1 || this.uiState.action.action.indexOf('\\') > -1) {
        throw new TypeError('Illegal characters in action');
      }

      this.router.navigate(['action', this.uiState.action.action]);
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
        }
      }
    }

    // Loading has completed.
    this.uiState.loading = false;
  }
}
