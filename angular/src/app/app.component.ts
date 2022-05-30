import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, NgZone, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UIState, CommunicationService, NetworksService, EnvironmentService, AppManager, SecureStateService, WalletManager, SettingsService } from './services';
import { Location } from '@angular/common'
import { TranslateService } from '@ngx-translate/core';
import { RuntimeService } from './services/runtime.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'blockcore-wallet';
  wallet: any;
  @ViewChild('drawer') drawer!: MatSidenav;
  @ViewChild('draweraccount') draweraccount!: MatSidenav;

  instanceName: string;

  constructor(public uiState: UIState,
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
    @Inject(DOCUMENT) private document: Document) {

    this.instanceName = this.env.instanceName;
  }

  maximize() {
    chrome.tabs.create({ active: true, selected: true, url: "index.html" });
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
