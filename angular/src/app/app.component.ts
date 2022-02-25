import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, NgZone, OnInit, Renderer2, ViewChild } from '@angular/core';
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
    private ngZone: NgZone,
    private env: EnvironmentService,
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

    const msg = this.communication.createMessage('index');
    const msg2 = this.communication.createMessage('hello_world');

    this.communication.send(msg);
    this.communication.sendToTabs(msg2);

    // chrome.runtime.sendMessage({ onLoad: 'finished' }, function (response) {
    //   console.log('AppComponent:sendMessage:response:', response);
    // });

    // chrome.runtime.onMessage.addListener((message, callback) => {
    //   this.ngZone.run(async () => {
    //     console.log('AppComponent:onMessage: ', message);
    //     console.log('AppComponent:onMessage:callback: ', callback);

    //     // Whenever the background process sends us tmeout, we know that wallets has been locked.
    //     if (message.event === 'timeout') {
    //       // Timeout was reached in the background. There is already logic listening to the session storage
    //       // that will reload state and redirect to home (unlock) if needed, so don't do that here. It will
    //       // cause a race condition on loading new state if redirect is handled here.
    //       console.log('Timeout was reached in the background service.');
    //     }
    //   });

    //   return "OK";

    //   // if (message === 'hello') {
    //   //   sendResponse({greeting: 'welcome!'})
    //   // } else if (message === 'goodbye') {
    //   //   chrome.runtime.Port.disconnect();
    //   // }
    // });

    // Whenever the unlocked wallet changes, if there are zero unlocked wallets, redirect to /home for unlocking.
    // this.secure.unlockedWallets$.subscribe(() => {
    //   console.log('UNLOCKED WALLETS SUBSCRIPTION:');
    //   console.log('hasUnlockedWallets', this.walletManager.hasUnlockedWallets);
    // });
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
