import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { UIState } from './services/ui-state.service';
import { CommunicationService } from './services/communication.service';
import { OrchestratorService } from './services/orchestrator.service';
import { Location } from '@angular/common'
import { NetworksService } from './services/networks.service';
import { environment } from '../environments/environment';
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

  constructor(public uiState: UIState,
    private router: Router,
    private renderer: Renderer2,
    public translate: TranslateService,
    private communication: CommunicationService,
    private manager: OrchestratorService,
    private location: Location,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    public networkService: NetworksService,
    @Inject(DOCUMENT) private document: Document) {

    translate.addLangs(['en', 'no', 'fr']);
    translate.setDefaultLang('en');

    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|no/) ? browserLang : 'en');

    document.title = environment.instanceName;

    const queryParam = window.location.search;
    console.log('queryParam:', queryParam);

    if (queryParam) {
      this.uiState.params = this.getQueryStringParams(queryParam);
    }

    this.route.queryParams
      .subscribe(params => {
        console.log('PARAMS:');
        console.log(params); // { orderby: "price" }
        // this.orderby = params.orderby;
        // console.log(this.orderby); // price
      });

    router.events.subscribe((val) => {
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
        translate.use(this.uiState.persisted.settings.language);
      }

      // if (this.uiState.persisted?.settings.theme === 'light') {
      //   this.renderer.setAttribute(document.body, 'color', 'warn');
      // } else {
      //   this.renderer.addClass(document.body, 'dark-theme');
      // }

    });

    // Make sure we initialize the orchestrator early and hook up event handlers.
    manager.initialize();
  }

  getQueryStringParams(query: string) {
    return query
      ? (/^[?#]/.test(query) ? query.slice(1) : query)
        .split('&')
        .reduce((params: any, param) => {
          let [key, value] = param.split('=');
          params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
          return params;
        }, {}
        )
      : {}
  };

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

  verifyPopup() {
    const isInPopup = function () {
      return (globalThis.chrome && globalThis.chrome.extension) ?
        chrome.extension.getViews({ type: "popup" }).length > 0 : null;
    }

    if (!isInPopup()) {
      // When the extension is rendered in full screen, we'll add an extra class to body.
      this.document.body.classList.add('full-mode');
    } else {
      //If you are already in the tab, do something else 
    }
  }

  ngOnInit(): void {
    // TODO: Find an alternative method to discover if app renders in tab or popup.
    // The issue here is a race-condition, where he popup does not close fast enough 
    // for this logic to run. So the length is larger then 0, when run too early.

    // THIS ALSO DOES NOT WORK IF USER HAS EXTENSION OPEN IN ANOTHER BROWSER WINDOW!
    setTimeout(() => {
      this.verifyPopup();
    }, 50);

    setTimeout(() => {
      this.verifyPopup();
    }, 500);

    setTimeout(() => {
      this.verifyPopup();
    }, 2000);

    this.verifyPopup();
  }

  lock() {
    // TODO: We also must remove the master key at this time, but we currently don't keep master key in-memory.
    // this.uiState.unlocked = false;

    if (!this.uiState.activeWallet) {
      return;
    }

    this.manager.lock(this.uiState.activeWallet.id);

    //this.uiState.port?.postMessage({ method: 'lock' });
    // this.uiState.password = null;

    this.drawer.close();

    // this.router.navigateByUrl('/home');
  }

  onAccountChanged(accountId: string) {
    this.draweraccount.toggle();
    this.manager.setActiveAccountId(accountId);
  }

  async onWalletChanged(event: any) {
    const walletId = event.value;

    this.drawer.close();

    if (!walletId) {
      this.router.navigateByUrl('/wallet/create');
    } else {
      this.manager.setActiveWalletId(walletId);

      // We also must update the local state immediately because we are not waiting for callback before redirect.
      this.uiState.persisted.activeWalletId = walletId;

      if (this.uiState.unlocked.findIndex(id => id == walletId) > -1) {
        this.router.navigateByUrl('/dashboard');
        //this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet?.activeAccountIndex);
      }
      else {
        // Make sure we route to home to unlock the newly selected wallet.
        this.router.navigateByUrl('/home');
      }

    }
  }
}
