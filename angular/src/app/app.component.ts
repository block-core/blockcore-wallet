import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { UIState } from './services/ui-state.service';
import { CommunicationService } from './services/communication.service';
import { OrchestratorService } from './services/orchestrator.service';
import { Location } from '@angular/common'
import { NetworksService } from './services/networks.service';
import { TranslateService } from '@ngx-translate/core';
import { EnvironmentService } from './services/environment.service';
import { AppManager } from 'src/background/application-manager';
import { SecureStateService } from './services/secure-state.service';
import { WalletManager } from '../background/wallet-manager';

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
    private manager: OrchestratorService,
    private appManager: AppManager,
    private location: Location,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private walletManager: WalletManager,
    private secure: SecureStateService,
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

  async ngOnInit() {














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

    this.walletManager.lockWallet(this.uiState.activeWallet.id);

    //this.uiState.port?.postMessage({ method: 'lock' });
    // this.uiState.password = null;

    this.drawer.close();

    this.router.navigateByUrl('/home');
  }

  onAccountChanged(accountId: string) {
    this.draweraccount.toggle();
    this.manager.setActiveAccountId(accountId);
  }

  async onWalletChanged(event: any) {
    const walletId = event.value;

    console.log('onWalletChanged!!!!!!!!!!!!', walletId);

    this.drawer.close();

    if (!walletId) {
      this.router.navigateByUrl('/wallet/create');
    } else {
      this.manager.setActiveWalletId(walletId);

      // We also must update the local state immediately because we are not waiting for callback before redirect.
      this.uiState.persisted.activeWalletId = walletId;

      if (this.secure.unlocked(walletId)) {
        this.router.navigateByUrl('/dashboard');
        //this.router.navigateByUrl('/account/view/' + this.uiState.activeWallet?.activeAccountIndex);
      } else {
        // Make sure we route to home to unlock the newly selected wallet.
        this.router.navigateByUrl('/home');
      }
    }
  }
}
