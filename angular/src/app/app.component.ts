import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, NgZone, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UIState, CommunicationService, NetworksService, EnvironmentService, AppManager, SecureStateService, WalletManager, SettingsService, LoggingMonitor } from './services';
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { RuntimeService } from '../shared/runtime.service';
import { FrontendService } from './services/frontend.service';
import { AppUpdateService } from './services/app-update.service';
import { ActionService } from './services/action.service';
import { DisableRightClickService } from './services/disable-right-click.service';
import { MessageService } from 'src/shared';
import { Database } from 'src/shared/store/storage';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'blockcore-wallet';
  wallet: any;
  @ViewChild('drawer') drawer!: MatSidenav;
  @ViewChild('draweraccount') draweraccount!: MatSidenav;

  instanceName: string;

  constructor(
    private logMonitor: LoggingMonitor,
    private frontendService: FrontendService,
    public uiState: UIState,
    private router: Router,
    private renderer: Renderer2,
    public translate: TranslateService,
    private message: MessageService,
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
    public action: ActionService,
    private rightClickDisable: DisableRightClickService,
    @Inject(DOCUMENT) private document: Document
  ) {
    // This must happen in the constructor on app component, or when loading in PWA, it won't
    // be possible to read the query parameters.
    const queryParam = globalThis.location.search;

    if (queryParam) {
      const param = Object.fromEntries(new URLSearchParams(queryParam)) as any;
      this.uiState.params = param;
    }

    this.instanceName = this.env.instanceName;

    if (this.env.production) {
      this.rightClickDisable.disableRightClick();
    }
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

    await Database.Instance.open();

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

    // Send event every time the UI has been activated.
    this.message.send(this.message.createMessage('activated'));
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
