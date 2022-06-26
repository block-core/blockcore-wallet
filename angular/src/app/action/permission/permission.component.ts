import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService, UIState, NetworksService, AppManager, WalletManager } from '../../services';
import { Router } from '@angular/router';
import { ActionService } from 'src/app/services/action.service';
import * as browser from 'webextension-polyfill';
import { PermissionArguments } from '../../../shared/interfaces';

@Component({
  selector: 'app-permission',
  templateUrl: './permission.component.html',
  styleUrls: ['./permission.component.css'],
})
export class ActionPermissionComponent {
  // content?: string;
  permission: PermissionArguments;

  constructor(public uiState: UIState, private crypto: CryptoService, private router: Router, private app: ApplicationRef, private ngZone: NgZone, private action: ActionService, public networkService: NetworksService, public walletManager: WalletManager, private manager: AppManager, private cd: ChangeDetectorRef) {
    this.uiState.title = 'Action: Permission';
    // this.content = this.uiState.action?.document;
  }

  ngOnInit() {
    // On permission action, the args should be PermissionArguments type.
    this.permission = this.uiState.action.args;
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
      type: this.uiState.action.action,
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
      type: this.uiState.action.action,
    });

    window.close();
  }
}
