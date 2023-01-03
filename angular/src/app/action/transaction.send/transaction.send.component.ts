import { Component, Inject, HostBinding, ChangeDetectorRef, ApplicationRef, NgZone, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService, UIState, NetworksService, AppManager, WalletManager } from '../../services';
import { Router } from '@angular/router';
import { ActionService } from 'src/app/services/action.service';
// import * as browser from 'webextension-polyfill';
import { ActionMessage, Permission } from 'src/shared';
import { PermissionStore } from 'src/shared/store/permission-store';
import { Actions, PERMISSIONS } from 'src/app/shared/constants';
const { v4: uuidv4 } = require('uuid');

@Component({
  selector: 'app-transaction-send',
  templateUrl: './transaction.send.component.html',
  styleUrls: ['./transaction.send.component.css'],
})
export class ActionTransactionSendComponent {
  contentToSign: string;
  content: any;

  constructor(
    public uiState: UIState,
    private permissionStore: PermissionStore,
    public actionService: ActionService,
    public networkService: NetworksService,
    public walletManager: WalletManager,
    private manager: AppManager,
    private cd: ChangeDetectorRef
  ) {
    this.content = uiState.action.content;
    this.contentToSign = JSON.stringify(this.content);
    this.actionService.consentType = 'ephemeral';
    this.actionService.permissionLevel = 'account';

    this.actionService.status.icon = 'currency_bitcoin';
    this.actionService.status.title = 'Send Transaction';
    this.actionService.status.description = `App wants you to perform a transaction`;
  }

  pay() {

    

  }
}
