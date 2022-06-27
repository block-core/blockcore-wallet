import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService, UIState, NetworksService, AppManager, WalletManager } from '../../services';
import { Router } from '@angular/router';
import { ActionService } from 'src/app/services/action.service';
import * as browser from 'webextension-polyfill';
import { ActionMessageResponse, Permission } from 'src/shared';
import { PermissionStore } from 'src/shared/store/permission-store';
import { Actions, PERMISSIONS } from 'src/app/shared/constants';
const { v4: uuidv4 } = require('uuid');

@Component({
  selector: 'app-sign',
  templateUrl: './sign.component.html',
  styleUrls: ['./sign.component.css'],
})
export class ActionSignComponent {
  content?: string;
  app: string;

  constructor(public uiState: UIState, private permissionStore: PermissionStore, private action: ActionService, public networkService: NetworksService, public walletManager: WalletManager, private manager: AppManager, private cd: ChangeDetectorRef) {
    this.uiState.title = 'Action: Signing';
    this.content = this.uiState.action?.document;
    this.app = this.uiState.action?.app;
  }

  // sign() {
  //   // this.manager.sign(this.content, this.uiState.action?.tabId);

  //   // Reset params so the action can be re-triggered.
  //   this.uiState.params = null;

  //   // TODO: Move this to a communication service.
  //   // Inform the provider script that user has signed the data.
  //   browser.runtime.sendMessage({
  //     prompt: true,
  //     target: 'provider',
  //     src: 'tabs',
  //     ext: 'blockcore',
  //     args: ['cipher'],
  //     id: this.uiState.action.id,
  //     type: this.uiState.action.action,
  //   });

  //   // window.close();
  // }

  authorize(permission: string) {
    // console.log('permission:', permission);
    // // const level = Actions.sign.[permission];

    // switch (permission) {
    //   case 'forever':
    //   case 'expirable':
    //     this.updatePermission({
    //       id: uuidv4(),
    //       domain: this.uiState.action.domain,
    //       action: permission,
    //       condition: permission,
    //       created: Math.round(Date.now() / 1000),
    //       // created: new Date().toISOString(),
    //     });
    //     // prompts[id]?.resolve?.()
    //     // updatePermission(host, {
    //     //   level,
    //     //   condition
    //     // })
    //     break;
    //   case 'once':
    //     // prompts[id]?.resolve?.()
    //     break;
    //   case 'no':
    //     // prompts[id]?.reject?.()
    //     break;
    // }

    // delete prompts[id]
    // browser.windows.remove(sender.tab.windowId);

    // this.manager.sign(this.content, this.uiState.action?.tabId);

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
    browser.runtime.sendMessage(reply);

    // window.close();
  }

  // exit() {
  //   this.action.clearAction();
  //   this.uiState.params = null;

  //   // TODO: Move this to a communication service.
  //   // Inform the provider script that user has signed the data.
  //   browser.runtime.sendMessage({
  //     prompt: true,
  //     target: 'provider',
  //     cancelled: true,
  //     src: 'tabs',
  //     ext: 'blockcore',
  //     level: 0,
  //     permission: 0,
  //     args: ['cipher'],
  //     id: this.uiState.action.id,
  //     type: this.uiState.action.action,
  //   });

  //   window.close();
  // }
}
