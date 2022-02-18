import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { UIState } from '../services/ui-state.service';
import { CryptoService } from '../services/crypto.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunicationService } from '../services/communication.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  problems: boolean;

  constructor(
    public uiState: UIState,
    private communication: CommunicationService
  ) {
    this.uiState.title = 'Loading...';
    this.uiState.manifest = chrome.runtime.getManifest();
  }

  ngOnDestroy(): void {

  }

  reload() {
    window.location.href = 'index.html';
  }

  async ngOnInit() {

    // When the extension has been initialized, we'll send 'state' to background to get the current state. The UI will show loading
    // indicator until 'state-changed' is triggered.
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, (tabs) => {
      // debugger;
      var tab = tabs[0];
      // Provide the tab URL with the state query, because wallets and accounts is connected to domains.
      this.communication.send('state-load', { url: tab?.url });
    });

    // If the state has not loaded or triggered after a timeout, display reload button / reset options.
    setTimeout(() => {
      this.problems = true;
    }, 5000);
  }
}
