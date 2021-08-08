import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, Router } from '@angular/router';
import { UIState } from './services/ui-state.service';
import { CommunicationService } from './services/communication.service';
import { OrchestratorService } from './services/orchestrator.service';

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
    private communication: CommunicationService,
    private manager: OrchestratorService,
    @Inject(DOCUMENT) private document: Document) {

    router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.uiState.active();
      }
    });

    // Make sure we initialize the orchestrator early and hook up event handlers.
    manager.initialize();
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

  async onAccountChanged(event: any) {
    const walletId = event.value;

    this.drawer.close();

    if (!walletId) {
      this.router.navigateByUrl('/wallet/create');
    } else {
      console.log('walletId:', walletId);

      this.communication.send('set-active-wallet-id', { id: walletId });

      this.uiState.persisted.activeWalletId = walletId;
      //await this.uiState.save();

      // Make sure we route to home to unlock the newly selected wallet.
      this.router.navigateByUrl('/home');
    }
  }
}
