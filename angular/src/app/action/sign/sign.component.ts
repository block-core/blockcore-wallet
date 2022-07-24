import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService, UIState, NetworksService, AppManager, WalletManager } from '../../services';
import { Router } from '@angular/router';
import { ActionService } from 'src/app/services/action.service';
// import * as browser from 'webextension-polyfill';
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

  contentToSign: string;

  constructor(public uiState: UIState, private permissionStore: PermissionStore, public action: ActionService, public networkService: NetworksService, public walletManager: WalletManager, private manager: AppManager, private cd: ChangeDetectorRef) {
    this.contentToSign = uiState.action.args;
  }
}
