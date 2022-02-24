import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UIState, CommunicationService, NetworksService, EnvironmentService, AppManager, SecureStateService, WalletManager, SettingsService } from './services';
import { Location } from '@angular/common'
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'blockcore-extension';
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
    private env: EnvironmentService,
    public networkService: NetworksService,
    @Inject(DOCUMENT) private document: Document) {

    this.instanceName = this.env.instanceName;
  }

  async wipe() {
    this.uiState.wipe();
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
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        // this.uiState.showBackButton = false;
        // this.uiState.title = '';
        this.uiState.active();
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
    // this.draweraccount.toggle();
    await this.walletManager.setActiveAccount(accountId);
  }
}
