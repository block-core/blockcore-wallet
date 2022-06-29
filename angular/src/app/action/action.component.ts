import { Component, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActionService } from 'src/app/services/action.service';
// import * as browser from 'webextension-polyfill';
import { ActionMessageResponse, Permission } from 'src/shared';
import { PermissionStore } from 'src/shared/store/permission-store';
import { Actions, PERMISSIONS } from 'src/app/shared/constants';
import { AppManager, NetworksService, UIState, WalletManager } from '../services';
const { v4: uuidv4 } = require('uuid');

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.css'],
})
export class ActionComponent {
  constructor(public uiState: UIState, private permissionStore: PermissionStore, private action: ActionService, public networkService: NetworksService, public walletManager: WalletManager, private manager: AppManager, private cd: ChangeDetectorRef) {
    this.uiState.title = 'Action: ' + this.uiState.action?.action;
    this.action.content = this.uiState.action?.document;
    this.action.app = this.uiState.action?.app;
  }

  @HostListener('window:beforeunload')
  rejectDialog() {
    this.authorize('no');
  }

  authorize(permission: string) {
    // Reset params so the action can be re-triggered.
    this.uiState.params = null;

    const reply: ActionMessageResponse = {
      prompt: true, // This indicates that message comes from the popup promt.
      target: 'provider',
      src: 'tabs',
      ext: 'blockcore',
      permission: permission,
      args: ['cipher'],
      id: this.uiState.action.id,
      action: this.uiState.action.action,
      app: this.uiState.action.app,
    };

    // TODO: Move this to a communication service.
    // Inform the provider script that user has signed the data.
    chrome.runtime.sendMessage(reply);
  }
}
