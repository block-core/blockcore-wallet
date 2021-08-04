import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { ApplicationState } from './services/application-state.service';

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

  constructor(public appState: ApplicationState,
    private router: Router,
    @Inject(DOCUMENT) private document: Document) {

  }

  ngOnInit(): void {

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

  }

  lock() {
    // TODO: We also must remove the master key at this time, but we currently don't keep master key in-memory.
    this.appState.unlocked = false;
    this.drawer.close();
    this.router.navigateByUrl('/home');
  }

  async onAccountChanged(event: any) {
    const walletIndex = event.value;

    console.log(JSON.stringify(this.appState.persisted));

    this.drawer.close();

    if (walletIndex === -1) {
      this.router.navigateByUrl('/wallet/create');
    } else {
      console.log('walletIndex:', walletIndex);

      this.appState.persisted.activeWalletIndex = walletIndex;
      await this.appState.save();

      console.log(this.appState.persisted.activeWalletIndex);

      // Make sure we route to home to unlock the newly selected wallet.
      this.router.navigateByUrl('/home');
    }
  }
}
