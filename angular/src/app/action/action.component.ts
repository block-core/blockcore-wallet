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
  constructor(public uiState: UIState, private permissionStore: PermissionStore, public action: ActionService, public networkService: NetworksService, public walletManager: WalletManager, private manager: AppManager, private cd: ChangeDetectorRef) {
    this.uiState.title = 'Action: ' + this.uiState.action?.action;
    this.action.content = this.uiState.action?.document;
    this.action.app = this.uiState.action?.app;
  }


}
