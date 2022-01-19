import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, Router } from '@angular/router';
import { UIState } from './services/ui-state.service';
import { CommunicationService } from './services/communication.service';
import { OrchestratorService } from './services/orchestrator.service';
import { Location } from '@angular/common'

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
    private communication: CommunicationService,
    private manager: OrchestratorService,
    private location: Location,
    private cd: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document) {

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

      // if (this.uiState.persisted?.settings.theme === 'light') {
      //   this.renderer.setAttribute(document.body, 'color', 'warn');
      // } else {
      //   this.renderer.addClass(document.body, 'dark-theme');
      // }


    });

    // Make sure we initialize the orchestrator early and hook up event handlers.
    manager.initialize();
  }

  async wipe() {
    this.uiState.wipe();
  }

  goBack() {
    if (this.uiState.goBackHome) {
      this.router.navigateByUrl('/dashboard');
    } else {
      this.location.back();
    }
  }

  ngOnInit(): void {

    // var sub1 = this.communication.listen('lock', () => {
    //   console.log('LOCK!');
    // });

    // var sub2 = this.communication.listen('lock2', () => {
    //   console.log('LOCK222!');
    // });

    // var sub3 = this.communication.listen('lock', () => {
    //   console.log('LOCK!');
    // });

    // // this.communication.unlisten(sub1);
    // // this.communication.unlisten(sub2);

    // var sub4 = this.communication.listen('lock', () => {
    //   console.log('LOCK!');
    // });

    // var sub5 = this.communication.listen('lock2', () => {
    //   console.log('LOCK2222!');
    // });

    // this.communication.unlisten(sub5);

    // this.communication.trigger('lock', { data: true });
    // this.communication.trigger('lock2', { data: true });

    // console.log(chrome.extension.getViews({ type: "tab" }));

    const isInPopup = function () {
      return (typeof chrome != undefined && chrome.extension) ?
        chrome.extension.getViews({ type: "popup" }).length > 0 : null;
    }

    if (!isInPopup()) {
      // When the extension is rendered in full screen, we'll add an extra class to body.
      this.document.body.classList.add('full-mode');

    } else {
      //If you are already in the tab, do something else 
    }

    // this.appState.port = chrome.runtime.connect({ name: 'extension-channel' });

    // this.appState.port.onMessage.addListener(message => {
    //   console.log('onMessage:', message);
    //   console.log(window.location.origin);
    //   // window.postMessage(message, window.location.origin);

    //   debugger;

    //   if (message.method == 'unlocked') {
    //     console.log('UNLOCKED! YEEE!', message);
    //   } else if (message.method == 'getlock') {
    //     this.appState.password = message.data;
    //   }

    // });

    // this.appState.port.onDisconnect.addListener(d => {
    //   this.appState.port = null;
    // });

    // // this.appState.port.postMessage({ question: 'Why is it?' });
    // // this.appState.port.postMessage({ method: 'unlocked' });
    // this.appState.port.postMessage({ method: 'getlock' });

    // window.postMessage('Hello World!!!', window.location.origin);
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

  onAccountChanged(index: number) {
    this.draweraccount.toggle();

    this.manager.setActiveAccountId(Number(index));

    this.cd.detectChanges();
  }

  async onWalletChanged(event: any) {
    debugger;
    const walletId = event.value;

    this.drawer.close();

    if (!walletId) {
      this.router.navigateByUrl('/wallet/create');
    } else {
      console.log('walletId:', walletId);

      console.log('onAccountChanged:');
      console.log(this.uiState.persisted.activeWalletId);
      console.log(walletId);

      this.manager.setActiveWalletId(walletId);

      // this.uiState.persisted.activeWalletId = walletId;
      //await this.uiState.save();

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
