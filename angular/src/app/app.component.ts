import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, NgZone, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UIState, CommunicationService, NetworksService, EnvironmentService, AppManager, SecureStateService, WalletManager, SettingsService } from './services';
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { RuntimeService } from './services/runtime.service';
import { FrontendService } from './services/frontend.service';
import { AppUpdateService } from './services/app-update.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'blockcore-wallet';
  wallet: any;
  @ViewChild('drawer') drawer!: MatSidenav;
  @ViewChild('draweraccount') draweraccount!: MatSidenav;

  instanceName: string;

  constructor(
    private frontendService: FrontendService,
    public uiState: UIState,
    private router: Router,
    private renderer: Renderer2,
    public translate: TranslateService,
    private communication: CommunicationService,
    private appManager: AppManager,
    private location: Location,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    public walletManager: WalletManager,
    private secure: SecureStateService,
    private settings: SettingsService,
    private ngZone: NgZone,
    private env: EnvironmentService,
    private runtime: RuntimeService,
    public networkService: NetworksService,
    public appUpdateService: AppUpdateService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.instanceName = this.env.instanceName;
  }

  maximize() {
    chrome.tabs.create({ active: true, selected: true, url: 'index.html' });
  }

  goBack() {
    if (this.uiState.goBackHome) {
      this.router.navigateByUrl('/dashboard');
    } else {
      if (this.uiState.backUrl) {
        this.router.navigateByUrl(this.uiState.backUrl);
      } else {
        this.location.back();
      }
    }

    this.uiState.backUrl = null;
  }

  async ngOnInit() {
    this.uiState.manifest = await this.runtime.getManifest();

    const queryParam = globalThis.location.search;

    // TODO: IT IS NOT POSSIBLE TO "EXIT" ACTIONS THAT ARE TRIGGERED WITH QUERY PARAMS.
    // FIX THIS ... attempted to check previous, but that does not work...
    if (queryParam) {
      const param = Object.fromEntries(new URLSearchParams(queryParam)) as any;
      console.log('THERE ARE PARAMS', param);
      // Only when the param is different than before, will we re-trigger the action.
      if (JSON.stringify(param) != JSON.stringify(this.uiState.params)) {
        this.uiState.params = param;
      } else {
        console.debug('PARAMS IS NOT DIFFERENT!! CONTINUE AS BEFORE!');
      }
    }

    console.log('uiState.params:', this.uiState.params);

    // let qs = new URLSearchParams(location.search);
    // let id = qs.get('id');
    // let host = qs.get('host');
    // let level = parseInt(qs.get('level'));
    // let params;
    // try {
    //   params = JSON.parse(qs.get('params'));
    // } catch (err) {
    //   params = null;
    // }

    this.router.events.subscribe(async (val) => {
      if (val instanceof NavigationEnd) {
        await this.walletManager.resetTimer();
      }
    });

    this.uiState.persisted$.subscribe(() => {
      if (this.settings.values.theme === 'light') {
        this.renderer.removeClass(document.body, 'dark-theme');
      } else {
        this.renderer.addClass(document.body, 'dark-theme');
      }

      if (this.settings.values.language) {
        this.translate.use(this.settings.values.language);
      }
    });

    console.log('CALLING ACTIVATED!!!');

    // Send event every time the UI has been activated.
    this.communication.send(this.communication.createMessage('activated'));
  }

  lock() {
    if (!this.walletManager.activeWallet) {
      return;
    }

    this.walletManager.lockWallet(this.walletManager.activeWallet.id);

    this.drawer.close();

    this.router.navigateByUrl('/home');
  }

  async onAccountChanged(accountId: string) {
    await this.walletManager.setActiveAccount(accountId);
  }
}
