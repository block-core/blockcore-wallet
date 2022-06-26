import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService, UIState, NetworksService, AppManager, WalletManager } from '../../services';
import { Router } from '@angular/router';
import { ActionService } from 'src/app/services/action.service';
import * as browser from 'webextension-polyfill';

@Component({
  selector: 'app-sign',
  templateUrl: './sign.component.html',
  styleUrls: ['./sign.component.css'],
})
export class ActionSignComponent {
  content?: string;

  constructor(public uiState: UIState, private crypto: CryptoService, private router: Router, private app: ApplicationRef, private ngZone: NgZone, private action: ActionService, public networkService: NetworksService, public walletManager: WalletManager, private manager: AppManager, private cd: ChangeDetectorRef) {
    this.uiState.title = 'Action: Signing';

    this.content = this.uiState.action?.document;
  }

  sign() {
    // this.manager.sign(this.content, this.uiState.action?.tabId);

    // Reset params so the action can be re-triggered.
    this.uiState.params = null;

    // TODO: Move this to a communication service.
    // Inform the provider script that user has signed the data.
    browser.runtime.sendMessage({
      prompt: true,
      target: 'provider',
      src: 'tabs',
      ext: 'blockcore',
      args: ['cipher'],
      id: this.uiState.action.id,
      type: this.uiState.action.action
    });

    window.close();
  }

  exit() {
    this.action.clearAction();
    this.uiState.params = null;

        // TODO: Move this to a communication service.
    // Inform the provider script that user has signed the data.
    browser.runtime.sendMessage({
      prompt: true,
      target: 'provider',
      cancelled: true,
      src: 'tabs',
      ext: 'blockcore',
      args: ['cipher'],
      id: this.uiState.action.id,
      type: this.uiState.action.action
    });

    window.close();
  }
}
